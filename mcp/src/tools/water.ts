import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'

export function registerWaterTools(server: McpServer) {
  server.tool(
    'log_water',
    'Registrar consumo de agua. Se suma al total del día.',
    {
      amount_ml: z.number().int().positive().default(250).describe('Cantidad en mililitros (default: 250ml = 1 vaso)'),
    },
    async ({ amount_ml }) => {
      const userId = await getUserId()
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase.from('water_logs').insert({
        user_id: userId,
        date: today,
        amount_ml,
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const { data: todayLogs } = await supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', userId)
        .eq('date', today)

      const total = todayLogs?.reduce((sum: number, l: { amount_ml: number }) => sum + l.amount_ml, 0) ?? 0
      const goal = 2000
      const pct = Math.round((total / goal) * 100)
      const glasses = Math.round(total / 250)

      let emoji = '💧'
      if (pct >= 100) emoji = '🎉'
      else if (pct >= 75) emoji = '💪'

      return {
        content: [{
          type: 'text' as const,
          text: `${emoji} Agua registrada: +${amount_ml}ml\nTotal hoy: ${total}ml / ${goal}ml (${pct}%) — ~${glasses} vasos`,
        }],
      }
    },
  )
}
