import { resolveApiKey } from '../../../mcp/src/auth'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  const userId = key ? await resolveApiKey(useSupabaseAdmin() as any, key) : null
  if (!userId) {
    throw createError({ statusCode: 401, message: 'API key inválida' })
  }
  return serveMcp(event, userId)
})
