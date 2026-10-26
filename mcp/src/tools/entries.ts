import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'
import { dateParam, resolveDate } from '../coach.js'

const TABLES = {
  weight: 'weight_logs',
  meal: 'meal_logs',
  water: 'water_logs',
  exercise: 'exercise_logs',
} as const

const EDITABLE: Record<keyof typeof TABLES, string[]> = {
  weight: ['weight_kg', 'date', 'notes'],
  meal: ['meal_type', 'food_name', 'quantity', 'unit', 'estimated_calories', 'date', 'notes'],
  water: ['amount_ml', 'date'],
  exercise: ['exercise_name', 'duration_minutes', 'calories_burned', 'date', 'notes'],
}

const entryType = z.enum(['weight', 'meal', 'water', 'exercise']).describe('Tipo de registro')

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

export function registerEntryTools(server: McpServer) {
  server.tool(
    'get_day_log',
    'Listar todos los registros de un día con su id (peso, comidas, agua, ejercicio). Úsalo antes de update_entry o delete_entry.',
    { date: dateParam },
    async ({ date }) => {
      const userId = await getUserId()
      const day = await resolveDate(userId, date)

      const [w, m, wa, e] = await Promise.all([
        supabase.from('weight_logs').select('id, weight_kg').eq('user_id', userId).eq('date', day),
        supabase.from('meal_logs').select('id, meal_type, food_name, quantity, unit, estimated_calories').eq('user_id', userId).eq('date', day).order('created_at'),
        supabase.from('water_logs').select('id, amount_ml').eq('user_id', userId).eq('date', day).order('created_at'),
        supabase.from('exercise_logs').select('id, exercise_name, duration_minutes, calories_burned').eq('user_id', userId).eq('date', day).order('created_at'),
      ])

      let out = `🗓️ Registros del ${day}:\n`
      out += `\n⚖️ Peso:\n${w.data?.map(x => `  [weight ${x.id}] ${x.weight_kg} kg`).join('\n') || '  —'}`
      out += `\n🍽️ Comidas:\n${m.data?.map(x => `  [meal ${x.id}] ${x.meal_type}: ${x.food_name} (${x.quantity} ${x.unit}) ${x.estimated_calories} kcal`).join('\n') || '  —'}`
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
        'Campos a cambiar. weight: weight_kg, date, notes. meal: meal_type, food_name, quantity, unit, estimated_calories, date, notes. water: amount_ml, date. exercise: exercise_name, duration_minutes, calories_burned, date, notes.',
      ),
    },
    async ({ type, id, changes }) => {
      const userId = await getUserId()
      const updates = Object.fromEntries(Object.entries(changes).filter(([k]) => EDITABLE[type].includes(k)))
      if (!Object.keys(updates).length) return text(`⚠️ Ningún campo válido para ${type}. Permitidos: ${EDITABLE[type].join(', ')}`)

      const { data, error } = await supabase
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
      const userId = await getUserId()
      const { data, error } = await supabase
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
