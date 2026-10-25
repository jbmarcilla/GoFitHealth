import { z } from 'zod'
import { randomBytes } from 'crypto'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'

export function registerReportTools(server: McpServer) {
  server.tool(
    'generate_report_link',
    'Generar un link público compartible con tu progreso. Expira en 7 días.',
    {
      scope: z.enum(['weekly', 'monthly']).default('weekly').describe('Alcance del reporte'),
    },
    async ({ scope }) => {
      const userId = await getUserId()
      const token = randomBytes(24).toString('hex')

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase.from('report_tokens').insert({
        token,
        user_id: userId,
        scope,
        expires_at: expiresAt.toISOString(),
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const siteUrl = process.env.GOFIT_SITE_URL ?? 'https://gofit.health'

      return {
        content: [{
          type: 'text' as const,
          text: `🔗 Reporte ${scope === 'weekly' ? 'semanal' : 'mensual'} generado:\n${siteUrl}/report/${token}\n\nExpira: ${expiresAt.toLocaleDateString('es-PE')}`,
        }],
      }
    },
  )
}
