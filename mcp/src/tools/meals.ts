import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { resolvePortionGrams } from '../utils/portions.js'
import { dateParam, resolveDate } from '../coach.js'

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

export function registerMealTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'log_meal',
    'Registrar una comida (desayuno, almuerzo, cena o snack). Si el usuario no dijo qué comida del día fue, pregúntale antes de llamar. Busca el alimento en la base de datos para calcular calorías automáticamente.',
    {
      meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).describe('Tipo de comida'),
      food_name: z.string().describe('Nombre del alimento (ej: arroz, pollo, ensalada)'),
      quantity: z.number().positive().describe('Cantidad consumida'),
      unit: z.enum(['g', 'ml', 'puno', 'taza', 'mano', 'cucharada', 'porcion']).default('porcion').describe('Unidad de medida'),
      estimated_calories: z.number().int().positive().optional().describe('Calorías estimadas (opcional, se calcula si el alimento está en la DB)'),
      notes: z.string().optional().describe('Notas adicionales'),
      date: dateParam,
    },
    async ({ meal_type, food_name, quantity, unit, estimated_calories, notes, date }) => {
      const userId = await ctx.userId()
      const today = await resolveDate(ctx, userId, date)

      let calories = estimated_calories ?? 0
      let foodId: string | null = null
      let foodCategory: string | null = null
      let densityInfo = ''

      const { data: foods } = await ctx.db
        .from('foods')
        .select('id, name, calories_per_100g, caloric_density, food_category')
        .ilike('name', `%${food_name}%`)
        .limit(1)

      if (foods?.length) {
        const food = foods[0]
        foodId = food.id
        foodCategory = food.food_category

        if (!estimated_calories) {
          let grams: number
          if (unit === 'g' || unit === 'ml') {
            grams = quantity
          } else {
            grams = (await resolvePortionGrams(ctx, unit, foodId, foodCategory)) * quantity
          }
          calories = Math.round((grams / 100) * food.calories_per_100g)
        }

        densityInfo = `\nDensidad calórica: ${DENSITY_LABELS[food.caloric_density] ?? food.caloric_density}`
      } else if (!estimated_calories) {
        return {
          content: [{
            type: 'text' as const,
            text: `⚠️ No encontré "${food_name}" en la base de datos. Indica las calorías estimadas con el parámetro estimated_calories, o primero agrega el alimento con add_food.`,
          }],
        }
      }

      const { error } = await ctx.db.from('meal_logs').insert({
        user_id: userId,
        date: today,
        meal_type,
        food_id: foodId,
        food_name,
        quantity,
        unit,
        estimated_calories: calories,
        notes,
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      return {
        content: [{
          type: 'text' as const,
          text: `✅ ${MEAL_LABELS[meal_type]} (${today}): ${food_name} (${quantity} ${unit}) — ${calories} kcal${densityInfo}`,
        }],
      }
    },
  )

  server.tool(
    'search_food',
    'Buscar alimentos en la base de datos compartida',
    {
      query: z.string().describe('Nombre del alimento a buscar'),
      limit: z.number().int().positive().default(10).describe('Máximo de resultados'),
    },
    async ({ query, limit }) => {
      const { data: foods, error } = await ctx.db
        .from('foods')
        .select('id, name, brand, calories_per_100g, protein_g, carbs_g, fat_g, caloric_density, serving_reference')
        .ilike('name', `%${query}%`)
        .limit(limit)

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }
      if (!foods?.length) return { content: [{ type: 'text' as const, text: `No se encontraron alimentos con "${query}".` }] }

      const lines = foods.map((f: {
        name: string
        brand: string | null
        calories_per_100g: number
        protein_g: number
        carbs_g: number
        fat_g: number
        caloric_density: string
        serving_reference: string | null
      }) => {
        const brand = f.brand ? ` (${f.brand})` : ''
        const density = DENSITY_LABELS[f.caloric_density] ?? f.caloric_density
        const ref = f.serving_reference ? ` | Ref: ${f.serving_reference}` : ''
        return `• ${f.name}${brand} — ${f.calories_per_100g} kcal/100g | P:${f.protein_g}g C:${f.carbs_g}g G:${f.fat_g}g | ${density}${ref}`
      })

      return {
        content: [{ type: 'text' as const, text: `🔍 Resultados para "${query}":\n\n${lines.join('\n')}` }],
      }
    },
  )

  server.tool(
    'add_food',
    'Agregar un alimento nuevo a la base de datos compartida. Verifica duplicados por nombre y marca.',
    {
      name: z.string().describe('Nombre del alimento'),
      calories_per_100g: z.number().positive().describe('Calorías por 100g'),
      protein_g: z.number().nonnegative().optional().describe('Proteínas por 100g'),
      carbs_g: z.number().nonnegative().optional().describe('Carbohidratos por 100g'),
      fat_g: z.number().nonnegative().optional().describe('Grasas por 100g'),
      brand: z.string().optional().describe('Marca'),
      food_category: z.string().optional().describe('Categoría (grains, protein, vegetables, fruits, dairy, fats, etc.)'),
    },
    async ({ name, calories_per_100g, protein_g, carbs_g, fat_g, brand, food_category }) => {
      const userId = await ctx.userId()

      const { data: existing } = await ctx.db
        .from('foods')
        .select('id, name, brand')
        .ilike('name', name)
        .ilike('brand', brand ?? '')
        .limit(1)

      if (existing?.length) {
        return {
          content: [{
            type: 'text' as const,
            text: `⚠️ Ya existe "${existing[0].name}"${existing[0].brand ? ` (${existing[0].brand})` : ''} en la base de datos.`,
          }],
        }
      }

      const { data, error } = await ctx.db
        .from('foods')
        .insert({
          name,
          calories_per_100g,
          protein_g: protein_g ?? 0,
          carbs_g: carbs_g ?? 0,
          fat_g: fat_g ?? 0,
          brand,
          food_category,
          added_by: userId,
        })
        .select('id, name, caloric_density')
        .single()

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const density = DENSITY_LABELS[data.caloric_density] ?? data.caloric_density
      return {
        content: [{
          type: 'text' as const,
          text: `✅ Alimento agregado: ${data.name} (${calories_per_100g} kcal/100g) — Densidad: ${density}`,
        }],
      }
    },
  )
}
