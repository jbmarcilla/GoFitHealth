export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.goal_type) {
    throw createError({ statusCode: 400, message: 'goal_type es requerido' })
  }

  await admin
    .from('goals')
    .update({ active: false })
    .eq('user_id', user.id)
    .eq('active', true)

  const { data, error } = await admin
    .from('goals')
    .insert({
      user_id: user.id,
      goal_type: body.goal_type,
      target_weight_kg: body.target_weight_kg || null,
      target_muscle_mass_kg: body.target_muscle_mass_kg || null,
      daily_calorie_target: body.daily_calorie_target || null,
      daily_water_ml: body.daily_water_ml || 2000,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al establecer objetivo' })
  }

  return data
})
