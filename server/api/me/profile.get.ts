export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()

  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al obtener perfil' })
  }

  return data
})
