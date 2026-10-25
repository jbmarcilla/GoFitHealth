import { randomBytes, createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  const label = body?.label || 'default'
  const rawKey = 'gf_' + randomBytes(32).toString('hex')
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 11)

  const { data, error } = await admin
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label,
    })
    .select('id, key_prefix, label, created_at')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al crear API key' })
  }

  return { ...data, key: rawKey }
})
