export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const admin = useSupabaseAdmin()

  const { error } = await admin
    .from('api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al eliminar API key' })
  }

  return { success: true }
})
