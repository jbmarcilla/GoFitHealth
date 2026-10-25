export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  const allowed = ['display_name', 'measurement_system', 'cooking_preference', 'timezone']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No hay campos para actualizar' })
  }

  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al actualizar perfil' })
  }

  return data
})
