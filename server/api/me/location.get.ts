import { getLocations } from '../../../mcp/src/location'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const history = await getLocations(useSupabaseAdmin() as any, user.id, 20)
  return { current: history.find(l => l.is_current) ?? null, history }
})
