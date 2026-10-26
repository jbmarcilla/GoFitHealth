import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'
import { dateParam, resolveDate } from '../coach.js'

export function registerWeightTools(server: McpServer) {
  server.tool(
    'log_weight',
    'Registrar peso de un día (hoy por defecto). Si ya hay registro ese día, lo actualiza.',
    { weight_kg: z.number().positive().describe('Peso en kilogramos'), date: dateParam },
    async ({ weight_kg, date }) => {
      const userId = await getUserId()
      const today = await resolveDate(userId, date)

      const { error } = await supabase
        .from('weight_logs')
        .upsert(
          { user_id: userId, date: today, weight_kg },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single()

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      return {
        content: [{ type: 'text' as const, text: `✅ Peso registrado: ${weight_kg} kg (${today})` }],
      }
    },
  )

  server.tool(
    'get_progress',
    'Ver progreso de peso y calorías en los últimos N días',
    { days: z.number().int().positive().default(30).describe('Número de días a consultar') },
    async ({ days }) => {
      const userId = await getUserId()
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const { data: weights } = await supabase
        .from('weight_logs')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .gte('date', fromDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!weights?.length) {
        return { content: [{ type: 'text' as const, text: 'No hay registros de peso en este período.' }] }
      }

      const first = weights[0].weight_kg
      const last = weights[weights.length - 1].weight_kg
      const change = last - first
      const sign = change > 0 ? '+' : ''

      let text = `📊 Progreso de peso (${days} días):\n`
      text += `Inicio: ${first} kg → Actual: ${last} kg (${sign}${change.toFixed(1)} kg)\n\n`
      text += weights.map((w: { date: string; weight_kg: number }) => `${w.date}: ${w.weight_kg} kg`).join('\n')

      return { content: [{ type: 'text' as const, text }] }
    },
  )
}
