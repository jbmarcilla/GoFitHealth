import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { dateParam, resolveDate } from '../coach.js'

export function registerWaterTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'log_water',
    'Registrar consumo de agua. Se suma al total del día.',
    {
      amount_ml: z.number().int().positive().default(250).describe('Cantidad en mililitros (default: 250ml = 1 vaso)'),
      date: dateParam,
    },
    async ({ amount_ml, date }) => {
      const userId = await ctx.userId()
      const today = await resolveDate(ctx, userId, date)

      const { error } = await ctx.db.from('water_logs').insert({
        user_id: userId,
        date: today,
        amount_ml,
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const { data: todayLogs } = await ctx.db
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
          text: `${emoji} Agua registrada: +${amount_ml}ml\nTotal ${today}: ${total}ml / ${goal}ml (${pct}%) — ~${glasses} vasos`,
        }],
      }
    },
  )
}
