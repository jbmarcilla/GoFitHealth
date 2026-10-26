import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { dateParam, resolveDate } from '../coach.js'

const TABLES = {
  weight: 'weight_logs',
  meal: 'meal_logs',
  water: 'water_logs',
  exercise: 'exercise_logs',
} as const

const EDITABLE: Record<keyof typeof TABLES, string[]> = {
  weight: ['weight_kg', 'date', 'notes'],
  meal: ['meal_type', 'food_name', 'quantity', 'unit', 'estimated_calories', 'estimated_protein', 'estimated_carbs', 'estimated_fat', 'estimated_fiber', 'estimated_grams', 'date', 'notes'],
  water: ['amount_ml', 'date'],
  exercise: ['exercise_name', 'duration_minutes', 'calories_burned', 'date', 'notes'],
}

const entryType = z.enum(['weight', 'meal', 'water', 'exercise']).describe('Tipo de registro')

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

export function registerEntryTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'get_day_log',
    'Listar todos los registros de un día con su id (peso, comidas, agua, ejercicio). Úsalo antes de update_entry o delete_entry.',
    { date: dateParam },
    async ({ date }) => {
      const userId = await ctx.userId()
      const day = await resolveDate(ctx, userId, date)

      const [w, m, wa, e] = await Promise.all([
        ctx.db.from('weight_logs').select('id, weight_kg').eq('user_id', userId).eq('date', day),
        ctx.db.from('meal_logs').select('id, meal_type, food_name, quantity, unit, estimated_calories, estimated_protein, estimated_carbs, estimated_fat, estimated_grams').eq('user_id', userId).eq('date', day).order('created_at'),
        ctx.db.from('water_logs').select('id, amount_ml').eq('user_id', userId).eq('date', day).order('created_at'),
        ctx.db.from('exercise_logs').select('id, exercise_name, duration_minutes, calories_burned').eq('user_id', userId).eq('date', day).order('created_at'),
      ])

      let out = `🗓️ Registros del ${day}:\n`
      out += `\n⚖️ Peso:\n${w.data?.map(x => `  [weight ${x.id}] ${x.weight_kg} kg`).join('\n') || '  —'}`
      const incomplete: string[] = []
      out += `\n🍽️ Comidas:\n${m.data?.map((x) => {
        const hasMacros = x.estimated_protein !== null && x.estimated_carbs !== null && x.estimated_fat !== null
        const macros = hasMacros ? ` · P ${x.estimated_protein} C ${x.estimated_carbs} G ${x.estimated_fat}` : ' · ⚠️ sin macros'
        const grams = x.estimated_grams ? ` ≈ ${x.estimated_grams} g` : ' · ⚠️ sin gramos'
        if (!hasMacros || !x.estimated_grams) incomplete.push(x.id)
        return `  [meal ${x.id}] ${x.meal_type}: ${x.food_name} (${x.quantity} ${x.unit}${grams}) ${x.estimated_calories} kcal${macros}`
      }).join('\n') || '  —'}`
      if (incomplete.length) {
        out += `\n\n🤖 Para el asistente: ${incomplete.length} comida(s) sin macros o gramos. Complétalas AHORA con update_entry (type "meal", changes: estimated_protein, estimated_carbs, estimated_fat, estimated_fiber, estimated_grams) usando tus valores típicos. No le preguntes al usuario.`
      }
      out += `\n💧 Agua:\n${wa.data?.map(x => `  [water ${x.id}] ${x.amount_ml} ml`).join('\n') || '  —'}`
      out += `\n🏃 Ejercicio:\n${e.data?.map(x => `  [exercise ${x.id}] ${x.exercise_name} ${x.duration_minutes} min ${x.calories_burned} kcal`).join('\n') || '  —'}`
      return text(out)
    },
  )

  server.tool(
    'update_entry',
    'Corregir un registro existente (por id de get_day_log). Solo envía los campos a cambiar.',
    {
      type: entryType,
      id: z.string().uuid().describe('Id del registro'),
      changes: z.record(z.string(), z.union([z.string(), z.number()])).describe(
        'Campos a cambiar. weight: weight_kg, date, notes. meal: meal_type, food_name, quantity, unit, estimated_calories, estimated_protein, estimated_carbs, estimated_fat, estimated_fiber (g de la porción), estimated_grams (peso de la porción), date, notes. water: amount_ml, date. exercise: exercise_name, duration_minutes, calories_burned, date, notes.',
      ),
    },
    async ({ type, id, changes }) => {
      const userId = await ctx.userId()
      const updates = Object.fromEntries(Object.entries(changes).filter(([k]) => EDITABLE[type].includes(k)))
      if (!Object.keys(updates).length) return text(`⚠️ Ningún campo válido para ${type}. Permitidos: ${EDITABLE[type].join(', ')}`)

      const { data, error } = await ctx.db
        .from(TABLES[type])
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')

      if (error) return text(`Error: ${error.message}`)
      if (!data?.length) return text('⚠️ No encontré ese registro.')
      return text(`✏️ Registro actualizado: ${Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ')}`)
    },
  )

  server.tool(
    'delete_entry',
    'Eliminar un registro equivocado (por id de get_day_log). Confirma con el usuario antes de llamar.',
    { type: entryType, id: z.string().uuid().describe('Id del registro') },
    async ({ type, id }) => {
      const userId = await ctx.userId()
      const { data, error } = await ctx.db
        .from(TABLES[type])
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')

      if (error) return text(`Error: ${error.message}`)
      if (!data?.length) return text('⚠️ No encontré ese registro.')
      return text('🗑️ Registro eliminado.')
    },
  )
}
