import type { H3Event } from 'h3'

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function requireApiKey(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'API key requerida' })
  }

  const apiKey = authHeader.slice(7)
  const keyHash = await sha256(apiKey)

  const admin = useSupabaseAdmin()
  const { data, error } = await admin
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 401, message: 'API key inválida' })
  }

  await admin
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return data.user_id as string
}
