export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.exercise_name || !body?.duration_minutes || !body?.calories_burned) {
    throw createError({ statusCode: 400, message: 'exercise_name, duration_minutes y calories_burned son requeridos' })
  }

  const today = await userToday(user.id)

  const { data, error } = await admin
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      date: today,
      exercise_id: body.exercise_id || null,
      exercise_name: body.exercise_name,
      duration_minutes: body.duration_minutes,
      calories_burned: body.calories_burned,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al registrar ejercicio' })
  }

  return data
})
