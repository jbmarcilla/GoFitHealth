async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateRandomKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return 'gf_' + hex
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  const label = body?.label || 'default'
  const rawKey = generateRandomKey()
  const keyHash = await sha256(rawKey)
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
    throw createError({ statusCode: 500, message: `Error al crear API key: ${error.message}` })
  }

  return { ...data, key: rawKey }
})
