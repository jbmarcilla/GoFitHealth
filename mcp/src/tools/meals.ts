import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { resolvePortionGrams } from '../utils/portions.js'
import { dateParam, resolveDate } from '../coach.js'
import { countryFlag, ensureCountry, getCurrentLocation } from '../location.js'
import {
  FOOD_SELECT,
  type FoodRow,
  type MealNutrition,
  formatAmount,
  getNutrientDefs,
  insertMealLog,
  nutritionFromFood,
  sanitizeNutrients,
  summarizeNutrition,
  upsertFoodNutrients,
} from '../nutrition.js'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

const DENSITY_LABELS: Record<string, string> = {
  green: '🟢 Baja',
  yellow: '🟡 Media',
  red: '🔴 Alta',
}

const nutrientsParam = z
  .record(z.string(), z.number().nonnegative())
  .optional()
  .describe('Micronutrientes como {clave: cantidad}. Claves: fiber, sugar, saturated_fat, cholesterol, omega3, sodium, potassium, calcium, iron, magnesium, zinc, phosphorus, selenium, vitamin_a, vitamin_c, vitamin_d, vitamin_e, vitamin_k, vitamin_b1, vitamin_b2, vitamin_b3, vitamin_b6, vitamin_b12, folate. Unidades: g para macros, mg para minerales/vit C/E/B, mcg para vit A/D/K/B12/folato/selenio. Si falta una clave, regístrala con add_nutrient.')

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

function unknownKeysNote(input: Record<string, number> | undefined, kept: Record<string, number>) {
  if (!input) return ''
  const missing = Object.keys(input).filter(k => !(k in kept))
  return missing.length ? `\n⚠️ Nutrientes no reconocidos (no guardados): ${missing.join(', ')}. Regístralos con add_nutrient y vuelve a enviarlos.` : ''
}

function macroLine(n: MealNutrition) {
  const parts: string[] = []
  if (n.protein_g !== null) parts.push(`P ${n.protein_g} g`)
  if (n.carbs_g !== null) parts.push(`C ${n.carbs_g} g`)
  if (n.fat_g !== null) parts.push(`G ${n.fat_g} g`)
  if (n.fiber_g) parts.push(`Fibra ${n.fiber_g} g`)
  return parts.length ? `\nMacros: ${parts.join(' · ')}` : ''
}

export function registerMealTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'log_meal',
    'Registrar una comida (desayuno, almuerzo, cena o snack). Si el usuario no dijo qué comida del día fue, pregúntale antes. Si el alimento está en la DB, calcula gramos, calorías, macros y micronutrientes según la cantidad. Si no está, agrégalo primero con add_food (con sus nutrientes) o pasa estimated_calories y macros.',
    {
      meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).describe('Tipo de comida'),
      food_name: z.string().describe('Nombre del alimento (ej: arroz, pollo, ensalada)'),
      quantity: z.number().positive().describe('Cantidad consumida'),
      unit: z.enum(['g', 'ml', 'puno', 'taza', 'mano', 'cucharada', 'porcion']).default('porcion').describe('Unidad de medida'),
      estimated_calories: z.number().int().positive().optional().describe('Calorías de la porción (solo si el alimento no está en la DB)'),
      protein_g: z.number().nonnegative().optional().describe('Proteína de la porción en g (si no está en la DB)'),
      carbs_g: z.number().nonnegative().optional().describe('Carbohidratos de la porción en g (si no está en la DB)'),
      fat_g: z.number().nonnegative().optional().describe('Grasa de la porción en g (si no está en la DB)'),
      fiber_g: z.number().nonnegative().optional().describe('Fibra de la porción en g (si no está en la DB)'),
      nutrients: nutrientsParam,
      notes: z.string().optional().describe('Notas adicionales'),
      date: dateParam,
    },
    async ({ meal_type, food_name, quantity, unit, estimated_calories, protein_g, carbs_g, fat_g, fiber_g, nutrients, notes, date }) => {
      const userId = await ctx.userId()
      const today = await resolveDate(ctx, userId, date)

      const { data: foods } = await ctx.db
        .from('foods')
        .select(FOOD_SELECT)
        .ilike('name', `%${food_name}%`)
        .limit(1)
      const food = (foods?.[0] as FoodRow | undefined) ?? null

      let nutrition: MealNutrition
      let densityInfo = ''
      let unknownNote = ''

      if (food) {
        const grams = unit === 'g' || unit === 'ml'
          ? quantity
          : (await resolvePortionGrams(ctx, unit, food.id, food.food_category)) * quantity
        nutrition = await nutritionFromFood(ctx.db, food, grams)
        if (estimated_calories) nutrition.calories = estimated_calories
        if (nutrients) {
          const extra = await sanitizeNutrients(ctx.db, nutrients)
          nutrition.nutrients = { ...nutrition.nutrients, ...extra }
          unknownNote = unknownKeysNote(nutrients, extra)
        }
        densityInfo = `\nDensidad calórica: ${DENSITY_LABELS[food.caloric_density] ?? food.caloric_density}`
      } else {
        if (!estimated_calories) {
          return text(`⚠️ No encontré "${food_name}" en la base de datos. Agrégalo con add_food (calorías, macros y nutrientes por 100 g) para que quede para todos, o pasa estimated_calories y macros de la porción.`)
        }
        const kept = await sanitizeNutrients(ctx.db, nutrients)
        unknownNote = unknownKeysNote(nutrients, kept)
        nutrition = {
          grams: unit === 'g' || unit === 'ml' ? quantity : null,
          calories: estimated_calories,
          protein_g: protein_g ?? null,
          carbs_g: carbs_g ?? null,
          fat_g: fat_g ?? null,
          fiber_g: fiber_g ?? null,
          nutrients: kept,
        }
      }

      try {
        await insertMealLog(ctx.db, {
          user_id: userId, date: today, meal_type, food_id: food?.id ?? null, food_name, quantity, unit, notes,
        }, nutrition)
      } catch (e: any) {
        return text(`Error: ${e.message}`)
      }

      const micro = Object.keys(nutrition.nutrients).length
      const gramsInfo = nutrition.grams ? ` ≈ ${nutrition.grams} g` : ''
      return text(
        `✅ ${MEAL_LABELS[meal_type]} (${today}): ${food_name} (${quantity} ${unit}${gramsInfo}) — ${nutrition.calories} kcal`
        + macroLine(nutrition)
        + (micro ? `\nMicronutrientes guardados: ${micro}` : (food ? '\nEste alimento aún no tiene micronutrientes en la DB: si los conoces, agrégalos con set_food_nutrients.' : ''))
        + densityInfo
        + unknownNote,
      )
    },
  )

  server.tool(
    'search_food',
    'Buscar alimentos en la base de datos compartida. Muestra primero los del país donde está el usuario.',
    {
      query: z.string().describe('Nombre del alimento a buscar'),
      limit: z.number().int().positive().default(10).describe('Máximo de resultados'),
    },
    async ({ query, limit }) => {
      const userId = await ctx.userId()
      const [{ data: foods, error }, location] = await Promise.all([
        ctx.db
          .from('foods')
          .select('id, name, brand, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g, caloric_density, serving_reference, country:countries(code), food_nutrients(nutrient_key)')
          .ilike('name', `%${query}%`)
          .limit(limit * 3),
        getCurrentLocation(ctx.db, userId),
      ])

      if (error) return text(`Error: ${error.message}`)
      if (!foods?.length) return text(`No se encontraron alimentos con "${query}". Puedes agregarlo con add_food.`)

      type Row = {
        name: string
        brand: string | null
        calories_per_100g: number
        protein_g: number
        carbs_g: number
        fat_g: number
        fiber_g: number
        caloric_density: string
        serving_reference: string | null
        country: { code: string } | null
        food_nutrients: { nutrient_key: string }[]
      }
      const here = location?.country.code
      const rank = (f: Row) => (f.country?.code === here ? 0 : f.country ? 2 : 1)
      const sorted = (foods as unknown as Row[]).sort((a, b) => rank(a) - rank(b)).slice(0, limit)

      const lines = sorted.map((f) => {
        const brand = f.brand ? ` (${f.brand})` : ''
        const flag = f.country ? ` ${countryFlag(f.country.code)}` : ''
        const density = DENSITY_LABELS[f.caloric_density] ?? f.caloric_density
        const ref = f.serving_reference ? ` | Ref: ${f.serving_reference}` : ''
        const micro = f.food_nutrients?.length ? ` | ${f.food_nutrients.length} micronutrientes` : ' | sin micronutrientes'
        return `• ${f.name}${brand}${flag} — ${f.calories_per_100g} kcal/100g | P:${f.protein_g}g C:${f.carbs_g}g G:${f.fat_g}g F:${f.fiber_g ?? 0}g | ${density}${ref}${micro}`
      })

      return text(`🔍 Resultados para "${query}":\n\n${lines.join('\n')}`)
    },
  )

  server.tool(
    'add_food',
    'Agregar un alimento nuevo a la base de datos compartida, con sus valores por 100 g: calorías, macros y todos los micronutrientes que conozcas (vitaminas, minerales, azúcar, sodio...). Verifica duplicados por nombre y marca.',
    {
      name: z.string().describe('Nombre del alimento'),
      calories_per_100g: z.number().positive().describe('Calorías por 100g'),
      protein_g: z.number().nonnegative().optional().describe('Proteínas por 100g'),
      carbs_g: z.number().nonnegative().optional().describe('Carbohidratos por 100g'),
      fat_g: z.number().nonnegative().optional().describe('Grasas por 100g'),
      fiber_g: z.number().nonnegative().optional().describe('Fibra por 100g'),
      nutrients: nutrientsParam,
      brand: z.string().optional().describe('Marca'),
      food_category: z.string().optional().describe('Categoría (grains, protein, vegetables, fruits, dairy, fats, etc.)'),
      country_code: z.string().length(2).optional().describe('País ISO (ej. PE) si es un alimento o marca local. Omitir si es universal (ej. manzana).'),
    },
    async ({ name, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g, nutrients, brand, food_category, country_code }) => {
      const userId = await ctx.userId()
      const countryId = country_code ? await ensureCountry(ctx.db, country_code) : null

      const { data: existing } = await ctx.db
        .from('foods')
        .select('id, name, brand')
        .ilike('name', name)
        .ilike('brand', brand ?? '')
        .limit(1)

      if (existing?.length) {
        return text(`⚠️ Ya existe "${existing[0].name}"${existing[0].brand ? ` (${existing[0].brand})` : ''} en la base de datos. Si quieres completar sus micronutrientes usa set_food_nutrients.`)
      }

      const { data, error } = await ctx.db
        .from('foods')
        .insert({
          name,
          calories_per_100g,
          protein_g: protein_g ?? 0,
          carbs_g: carbs_g ?? 0,
          fat_g: fat_g ?? 0,
          fiber_g: fiber_g ?? 0,
          brand,
          food_category,
          country_id: countryId,
          added_by: userId,
        })
        .select('id, name, caloric_density')
        .single()

      if (error) return text(`Error: ${error.message}`)

      const kept = await sanitizeNutrients(ctx.db, nutrients)
      let savedCount = 0
      try {
        savedCount = await upsertFoodNutrients(ctx.db, data.id, kept, userId)
      } catch (e: any) {
        return text(`Alimento agregado, pero falló guardar nutrientes: ${e.message}`)
      }

      const density = DENSITY_LABELS[data.caloric_density] ?? data.caloric_density
      return text(
        `✅ Alimento agregado: ${data.name} (${calories_per_100g} kcal/100g) — Densidad: ${density}`
        + `\nMicronutrientes guardados: ${savedCount}`
        + unknownKeysNote(nutrients, kept),
      )
    },
  )

  server.tool(
    'set_food_nutrients',
    'Agregar o corregir micronutrientes (por 100 g) de un alimento que ya existe en la DB. Úsalo cuando un alimento no tenga micronutrientes o detectes valores nuevos.',
    {
      food_name: z.string().describe('Nombre del alimento tal como está en la DB (o parte del nombre)'),
      nutrients: z.record(z.string(), z.number().nonnegative()).describe('Micronutrientes por 100 g como {clave: cantidad}'),
      fiber_g: z.number().nonnegative().optional().describe('Fibra por 100 g, si quieres corregirla'),
    },
    async ({ food_name, nutrients, fiber_g }) => {
      const userId = await ctx.userId()
      const { data: foods } = await ctx.db.from('foods').select('id, name').ilike('name', `%${food_name}%`).limit(2)
      if (!foods?.length) return text(`No encontré "${food_name}". Agrégalo con add_food.`)
      if (foods.length > 1 && foods[0].name.toLowerCase() !== food_name.toLowerCase()) {
        return text(`Hay varios alimentos parecidos: ${foods.map(f => `"${f.name}"`).join(', ')}. Indica el nombre exacto.`)
      }
      const food = foods[0]
      const kept = await sanitizeNutrients(ctx.db, nutrients)
      try {
        const n = await upsertFoodNutrients(ctx.db, food.id, kept, userId)
        if (fiber_g !== undefined) await ctx.db.from('foods').update({ fiber_g }).eq('id', food.id)
        return text(`✅ ${food.name}: ${n} micronutrientes guardados.` + unknownKeysNote(nutrients, kept))
      } catch (e: any) {
        return text(`Error: ${e.message}`)
      }
    },
  )

  server.tool(
    'add_nutrient',
    'Registrar un nutriente nuevo en el catálogo (ej. yodo, cobre, colina) para poder guardarlo en alimentos y comidas. Antes revisa la lista de claves conocidas; no dupliques con otro nombre.',
    {
      key: z.string().regex(/^[a-z][a-z0-9_]{1,30}$/).describe('Clave en snake_case, ej. iodine, copper, choline'),
      name: z.string().describe('Nombre para mostrar, ej. "Yodo"'),
      unit: z.enum(['g', 'mg', 'mcg']).describe('Unidad en la que se mide'),
      category: z.enum(['macro', 'vitamin', 'mineral', 'other']).describe('Categoría'),
      daily_reference: z.number().positive().optional().describe('Valor de referencia diario para un adulto, en la misma unidad'),
      is_limit: z.boolean().default(false).describe('true si conviene no pasarse (como sodio o azúcar)'),
    },
    async ({ key, name, unit, category, daily_reference, is_limit }) => {
      const userId = await ctx.userId()
      const defs = await getNutrientDefs(ctx.db)
      const dup = defs.find(d => d.key === key || d.name.toLowerCase() === name.toLowerCase())
      if (dup) return text(`Ya existe: ${dup.name} (${dup.key}, ${dup.unit}). Úsalo con esa clave.`)

      const { error } = await ctx.db.from('nutrients').insert({
        key, name, unit, category, daily_reference: daily_reference ?? null, is_limit, sort_order: 200, added_by: userId,
      })
      if (error) return text(`Error: ${error.message}`)
      defs.push({ key, name, unit, category, daily_reference: daily_reference ?? null, is_limit, sort_order: 200 })
      return text(`✅ Nutriente registrado: ${name} (${key}, ${unit}${daily_reference ? `, referencia ${daily_reference} ${unit}/día` : ''}). Ya puedes usarlo en add_food, set_food_nutrients y log_meal.`)
    },
  )

  server.tool(
    'get_nutrition_summary',
    'Ver cuánto está consumiendo el usuario: calorías, macros y micronutrientes por día, con % de la referencia diaria. Señala lo que va bajo y lo que se pasa (sodio, azúcar).',
    {
      days: z.number().int().positive().max(90).default(7).describe('Días hacia atrás (1 = solo hoy)'),
    },
    async ({ days }) => {
      const userId = await ctx.userId()
      const to = await resolveDate(ctx, userId)
      const from = new Date(`${to}T00:00:00Z`)
      from.setUTCDate(from.getUTCDate() - (days - 1))
      const fromStr = from.toISOString().slice(0, 10)

      const s = await summarizeNutrition(ctx.db, userId, fromStr, to, days)
      if (!s.meals) return text(`Sin comidas registradas entre ${fromStr} y ${to}.`)

      const { data: goal } = await ctx.db.from('goals').select('daily_calorie_target, daily_protein_g').eq('user_id', userId).eq('active', true).maybeSingle()

      let out = `🥗 Nutrición ${days === 1 ? 'de hoy' : `(promedio diario, ${days} días)`} — ${s.meals} comidas\n\n`
      out += `Calorías: ${s.calories} kcal${goal?.daily_calorie_target ? ` / ${goal.daily_calorie_target}` : ''}\n`
      out += `Proteína: ${s.protein_g} g${goal?.daily_protein_g ? ` / ${goal.daily_protein_g}` : ''} · Carbos: ${s.carbs_g} g · Grasa: ${s.fat_g} g · Fibra: ${s.fiber_g} g\n`

      const micro = s.nutrients.filter(n => n.key !== 'fiber')
      if (micro.length) {
        out += `\nMicronutrientes (por día, % de referencia):\n`
        for (const n of micro) {
          const pct = n.percent !== null ? ` — ${n.percent}%` : ''
          const flag = n.percent === null ? '' : n.is_limit ? (n.percent > 100 ? ' ⚠️ te pasas' : ' ✅') : (n.percent < 50 ? ' 🔻 bajo' : n.percent >= 90 ? ' ✅' : '')
          out += `• ${n.name}: ${formatAmount(n)}${pct}${flag}\n`
        }
        const low = micro.filter(n => n.percent !== null && !n.is_limit && n.percent < 50).map(n => n.name)
        const high = micro.filter(n => n.percent !== null && n.is_limit && n.percent > 100).map(n => n.name)
        if (low.length) out += `\n🔻 Vas bajo en: ${low.join(', ')}. Sugiere alimentos locales que los aporten.`
        if (high.length) out += `\n⚠️ Te estás pasando en: ${high.join(', ')}.`
      } else {
        out += `\nAún no hay micronutrientes: los alimentos registrados no los tienen en la DB. Complétalos con set_food_nutrients cuando los conozcas.`
      }
      out += `\n\nNota: solo cuenta lo que está registrado; si faltan comidas o alimentos sin micronutrientes, los totales quedan cortos.`
      return text(out)
    },
  )
}
