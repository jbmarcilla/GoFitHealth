export default defineEventHandler(async (event) => {
  if (handleOAuthCors(event)) return null
  if (event.method !== 'POST') return oauthError(event, 405, 'invalid_request', 'Usa POST')

  const body = await readBody(event).catch(() => null)
  const redirectUris: unknown = body?.redirect_uris
  if (!Array.isArray(redirectUris) || !redirectUris.length || !redirectUris.every(u => typeof u === 'string' && isAllowedRedirectUri(u))) {
    return oauthError(event, 400, 'invalid_redirect_uri', 'redirect_uris debe ser una lista de URLs https')
  }

  const clientName = typeof body?.client_name === 'string' ? body.client_name.slice(0, 100) : null
  const clientId = `gofit_${randomHex(16)}`

  const { error } = await (useSupabaseAdmin() as any).from('oauth_clients').insert({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
  })
  if (error) return oauthError(event, 500, 'server_error', error.message)

  setResponseStatus(event, 201)
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    scope: OAUTH_SCOPE,
  }
})
