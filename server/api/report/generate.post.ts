export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  const scope = body?.scope || 'weekly'
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await admin
    .from('report_tokens')
    .insert({
      token,
      user_id: user.id,
      scope,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al generar reporte' })
  }

  return {
    token,
    url: `/report/${token}`,
    expires_at: expiresAt.toISOString(),
  }
})
