import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'

export function registerReportTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'generate_report_link',
    'Generar un link público compartible con tu progreso. Expira en 7 días.',
    {
      scope: z.enum(['weekly', 'monthly']).default('weekly').describe('Alcance del reporte'),
    },
    async ({ scope }) => {
      const userId = await ctx.userId()
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('')

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await ctx.db.from('report_tokens').insert({
        token,
        user_id: userId,
        scope,
        expires_at: expiresAt.toISOString(),
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const siteUrl = ctx.siteUrl

      return {
        content: [{
          type: 'text' as const,
          text: `🔗 Reporte ${scope === 'weekly' ? 'semanal' : 'mensual'} generado:\n${siteUrl}/report/${token}\n\nExpira: ${expiresAt.toLocaleDateString('es-PE')}`,
        }],
      }
    },
  )
}
