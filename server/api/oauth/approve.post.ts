export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { client_id: clientId, redirect_uri: redirectUri, code_challenge: codeChallenge, code_challenge_method: method, state, scope } = body ?? {}

  if (typeof clientId !== 'string' || typeof redirectUri !== 'string') {
    throw createError({ statusCode: 400, message: 'Faltan client_id o redirect_uri' })
  }
  const client = await getOAuthClient(clientId)
  if (!client || !client.redirect_uris.includes(redirectUri)) {
    throw createError({ statusCode: 400, message: 'Aplicación o dirección de retorno inválida' })
  }

  const target = new URL(redirectUri)
  if (typeof state === 'string') target.searchParams.set('state', state)

  if (typeof codeChallenge !== 'string' || !codeChallenge || method !== 'S256') {
    target.searchParams.set('error', 'invalid_request')
    target.searchParams.set('error_description', 'Se requiere PKCE con S256')
    return { redirect: target.toString() }
  }

  const code = await createAuthorizationCode({
    clientId,
    userId: user.id,
    redirectUri,
    codeChallenge,
    scope: typeof scope === 'string' ? scope : undefined,
  })
  target.searchParams.set('code', code)
  target.searchParams.set('iss', siteOrigin(event))
  return { redirect: target.toString() }
})
