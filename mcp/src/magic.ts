import type { SupabaseClient } from '@supabase/supabase-js'

export const LOGIN_LINK_TTL_MS = 5 * 60_000

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/** Single-use link that signs the user in and opens the dashboard. Expires in 5 minutes. */
export async function createLoginLink(db: SupabaseClient, userId: string, siteUrl: string, next = '/dashboard'): Promise<string> {
  const token = randomToken()
  const { error } = await db.from('login_tokens').insert({
    token_hash: await sha256(token),
    user_id: userId,
    expires_at: new Date(Date.now() + LOGIN_LINK_TTL_MS).toISOString(),
  })
  if (error) throw new Error(error.message)
  return `${siteUrl}/go?t=${token}&next=${encodeURIComponent(next)}`
}

/** Validates and burns a login token. Returns the user id or null. */
export async function redeemLoginToken(db: SupabaseClient, token: string): Promise<string | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null
  const tokenHash = await sha256(token)
  const { data } = await db
    .from('login_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('user_id')
    .maybeSingle()
  return (data?.user_id as string | undefined) ?? null
}
