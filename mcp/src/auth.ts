import type { SupabaseClient } from '@supabase/supabase-js'

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')
}

export async function resolveApiKey(db: SupabaseClient, apiKey: string): Promise<string | null> {
  const keyHash = await sha256(apiKey)
  const { data } = await db.from('api_keys').select('user_id').eq('key_hash', keyHash).maybeSingle()
  if (!data) return null

  await db.from('api_keys').update({ last_used: new Date().toISOString() }).eq('key_hash', keyHash)
  return data.user_id as string
}
