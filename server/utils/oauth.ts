import type { H3Event } from 'h3'

export const OAUTH_SCOPE = 'gofit'
const CODE_TTL_MS = 10 * 60 * 1000

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function randomHex(byteLength: number) {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}

export async function sha256Hex(text: string) {
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
}

async function sha256Base64Url(text: string) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
  return btoa(String.fromCharCode(...hash)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function siteOrigin(event: H3Event) {
  return getRequestURL(event).origin
}

/** Returns true when the request was a CORS preflight and has been answered. */
export function handleOAuthCors(event: H3Event) {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, mcp-protocol-version',
  })
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return true
  }
  return false
}

export function oauthError(event: H3Event, status: number, error: string, description: string) {
  setResponseStatus(event, status)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { error, error_description: description }
}

export function isAllowedRedirectUri(uri: string) {
  try {
    const url = new URL(uri)
    if (url.hash) return false
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  } catch {
    return false
  }
}

export async function getOAuthClient(clientId: string) {
  const { data } = await useSupabaseAdmin()
    .from('oauth_clients')
    .select('client_id, client_name, redirect_uris')
    .eq('client_id', clientId)
    .maybeSingle()
  return data as { client_id: string; client_name: string | null; redirect_uris: string[] } | null
}

export async function createAuthorizationCode(input: {
  clientId: string
  userId: string
  redirectUri: string
  codeChallenge: string
  scope?: string
}) {
  const code = randomHex(32)
  const { error } = await (useSupabaseAdmin() as any).from('oauth_codes').insert({
    code_hash: await sha256Hex(code),
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    scope: input.scope ?? OAUTH_SCOPE,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  })
  if (error) throw createError({ statusCode: 500, message: `No se pudo crear el código: ${error.message}` })
  return code
}

/** Validates and consumes an authorization code. Returns the user id or an error string. */
export async function redeemAuthorizationCode(input: {
  code: string
  clientId: string
  redirectUri: string
  codeVerifier: string
}): Promise<{ userId: string } | { error: string }> {
  const db = useSupabaseAdmin() as any
  const codeHash = await sha256Hex(input.code)

  const { data: row } = await db
    .from('oauth_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .select('client_id, user_id, redirect_uri, code_challenge, expires_at')
    .maybeSingle()

  if (!row) return { error: 'Código inválido o ya usado' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { error: 'Código expirado' }
  if (row.client_id !== input.clientId) return { error: 'El código no pertenece a este cliente' }
  if (row.redirect_uri !== input.redirectUri) return { error: 'redirect_uri no coincide' }
  if ((await sha256Base64Url(input.codeVerifier)) !== row.code_challenge) return { error: 'code_verifier inválido' }

  return { userId: row.user_id }
}

/** Issues a GoFit API key as the OAuth access token, replacing earlier tokens of the same client. */
export async function issueAccessToken(userId: string, clientId: string, label: string) {
  const db = useSupabaseAdmin() as any
  const token = `gf_${randomHex(32)}`

  await db.from('api_keys').delete().eq('user_id', userId).eq('oauth_client_id', clientId)

  const { error } = await db.from('api_keys').insert({
    user_id: userId,
    key_hash: await sha256Hex(token),
    key_prefix: token.slice(0, 11),
    label,
    oauth_client_id: clientId,
  })
  if (error) throw createError({ statusCode: 500, message: `No se pudo emitir el token: ${error.message}` })
  return token
}
