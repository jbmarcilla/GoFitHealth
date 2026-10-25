import type { H3Event } from 'h3'
import { createHash } from 'crypto'

export async function requireApiKey(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'API key requerida' })
  }

  const apiKey = authHeader.slice(7)
  const keyHash = createHash('sha256').update(apiKey).digest('hex')

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
