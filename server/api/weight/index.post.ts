export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.weight_kg || typeof body.weight_kg !== 'number') {
    throw createError({ statusCode: 400, message: 'weight_kg es requerido (número)' })
  }

  const today = await userToday(user.id)

  const { data, error } = await admin
    .from('weight_logs')
    .upsert(
      {
        user_id: user.id,
        date: today,
        weight_kg: body.weight_kg,
        notes: body.notes || null,
      },
      { onConflict: 'user_id,date' },
    )
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al registrar peso' })
  }

  return data
})
