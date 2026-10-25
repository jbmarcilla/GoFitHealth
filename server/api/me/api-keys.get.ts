export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()

  const { data, error } = await admin
    .from('api_keys')
    .select('id, key_prefix, label, last_used, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al listar API keys' })
  }

  return data
})
