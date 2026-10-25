export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()

  const { data, error } = await admin
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al obtener objetivo' })
  }

  return data
})
