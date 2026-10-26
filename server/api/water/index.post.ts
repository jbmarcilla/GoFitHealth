export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.amount_ml || typeof body.amount_ml !== 'number' || body.amount_ml <= 0) {
    throw createError({ statusCode: 400, message: 'amount_ml es requerido (número positivo)' })
  }

  const today = await userToday(user.id)

  const { data, error } = await admin
    .from('water_logs')
    .insert({
      user_id: user.id,
      date: today,
      amount_ml: body.amount_ml,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al registrar agua' })
  }

  return data
})
