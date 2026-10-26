import { resolveApiKey } from '../../../mcp/src/auth'

export default defineEventHandler(async (event) => {
  if (handleOAuthCors(event)) return null
  setResponseHeader(event, 'Access-Control-Expose-Headers', 'WWW-Authenticate')

  const auth = getHeader(event, 'authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
  const userId = token ? await resolveApiKey(useSupabaseAdmin() as any, token) : null

  if (!userId) {
    setResponseHeader(
      event,
      'WWW-Authenticate',
      `Bearer resource_metadata="${siteOrigin(event)}/.well-known/oauth-protected-resource"`,
    )
    return oauthError(event, 401, 'invalid_token', 'Inicia sesión en GoFit para conectar')
  }

  return serveMcp(event, userId)
})
