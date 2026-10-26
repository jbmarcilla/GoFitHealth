export default defineEventHandler(async (event) => {
  const { client_id: clientId, redirect_uri: redirectUri } = getQuery(event)
  if (typeof clientId !== 'string' || typeof redirectUri !== 'string') {
    throw createError({ statusCode: 400, message: 'Faltan client_id o redirect_uri' })
  }

  const client = await getOAuthClient(clientId)
  if (!client) throw createError({ statusCode: 404, message: 'Esta aplicación no está registrada en GoFit' })
  if (!client.redirect_uris.includes(redirectUri)) {
    throw createError({ statusCode: 400, message: 'La dirección de retorno no coincide con la aplicación' })
  }

  return { client_name: client.client_name || 'Aplicación externa' }
})
