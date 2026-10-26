export default defineEventHandler(async (event) => {
  if (handleOAuthCors(event)) return null
  if (event.method !== 'POST') return oauthError(event, 405, 'invalid_request', 'Usa POST')

  const body = (await readBody(event).catch(() => null)) ?? {}
  if (body.grant_type !== 'authorization_code') {
    return oauthError(event, 400, 'unsupported_grant_type', 'Solo se admite authorization_code')
  }

  const { code, client_id: clientId, redirect_uri: redirectUri, code_verifier: codeVerifier } = body
  if (![code, clientId, redirectUri, codeVerifier].every(v => typeof v === 'string' && v)) {
    return oauthError(event, 400, 'invalid_request', 'Faltan code, client_id, redirect_uri o code_verifier')
  }

  const client = await getOAuthClient(clientId)
  if (!client) return oauthError(event, 401, 'invalid_client', 'Cliente desconocido')

  const result = await redeemAuthorizationCode({ code, clientId, redirectUri, codeVerifier })
  if ('error' in result) return oauthError(event, 400, 'invalid_grant', result.error)

  const accessToken = await issueAccessToken(result.userId, clientId, client.client_name || 'Conector MCP')

  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { access_token: accessToken, token_type: 'Bearer', scope: OAUTH_SCOPE }
})
