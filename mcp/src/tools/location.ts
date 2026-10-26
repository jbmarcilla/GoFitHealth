import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { formatLocation, getLocations, setUserLocation } from '../location.js'

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

export function registerLocationTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'set_location',
    'Guardar dónde está el usuario ahora (país, ciudad y zona horaria). Úsalo cuando diga que viajó o está en otra ciudad/país. Ajusta su zona horaria y guarda el historial.',
    {
      country_code: z.string().length(2).describe('Código ISO del país, 2 letras (ej. PE, CL, MX)'),
      city: z.string().optional().describe('Ciudad (ej. Lima, Santiago)'),
      timezone: z.string().describe('Zona horaria IANA de esa ciudad (ej. America/Lima, America/Santiago)'),
    },
    async ({ country_code, city, timezone }) => {
      const userId = await ctx.userId()
      try {
        const { location, changed } = await setUserLocation(ctx.db, userId, { countryCode: country_code, city, timezone })
        if (!changed) return text(`📍 Ya estaba registrado en ${formatLocation(location)}.`)
        return text(`📍 Ubicación actualizada: ${formatLocation(location)} (${location.timezone}).\nSugiere comidas típicas y fáciles de conseguir ahí.`)
      } catch (e: any) {
        return text(`Error: ${e.message}`)
      }
    },
  )

  server.tool(
    'get_location_history',
    'Ver en qué lugares ha estado el usuario y desde cuándo.',
    { limit: z.number().int().positive().default(10).describe('Cuántos registros mostrar') },
    async ({ limit }) => {
      const userId = await ctx.userId()
      const locations = await getLocations(ctx.db, userId, limit)
      if (!locations.length) return text('Sin ubicaciones registradas. Pregúntale dónde está.')

      const fmt = (iso: string) => iso.slice(0, 10)
      const lines = locations.map(l =>
        `${l.is_current ? '▶' : '•'} ${formatLocation(l)} — desde ${fmt(l.started_at)}${l.ended_at ? ` hasta ${fmt(l.ended_at)}` : ' (actual)'}`,
      )
      return text(`🗺️ Historial de ubicaciones:\n${lines.join('\n')}`)
    },
  )
}
