export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const admin = useSupabaseAdmin()

  const { data: reportToken, error } = await admin
    .from('report_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !reportToken) {
    throw createError({ statusCode: 404, message: 'Reporte no encontrado' })
  }

  if (new Date(reportToken.expires_at) < new Date()) {
    throw createError({ statusCode: 410, message: 'Este reporte ha expirado' })
  }

  const userId = reportToken.user_id
  const scope = reportToken.scope

  const daysBack = scope === 'monthly' ? 30 : 7
  const from = new Date()
  from.setDate(from.getDate() - daysBack)
  const fromStr = from.toISOString().split('T')[0]

  const [profileRes, weightsRes, mealsRes, waterRes, exercisesRes, goalRes] = await Promise.all([
    admin.from('profiles').select('display_name, avatar_url').eq('id', userId).single(),
    admin.from('weight_logs').select('date, weight_kg').eq('user_id', userId).gte('date', fromStr).order('date'),
    admin.from('meal_logs').select('date, meal_type, food_name, estimated_calories').eq('user_id', userId).gte('date', fromStr),
    admin.from('water_logs').select('date, amount_ml').eq('user_id', userId).gte('date', fromStr),
    admin.from('exercise_logs').select('date, exercise_name, calories_burned, duration_minutes').eq('user_id', userId).gte('date', fromStr),
    admin.from('goals').select('*').eq('user_id', userId).eq('active', true).maybeSingle(),
  ])

  return {
    profile: profileRes.data,
    scope,
    weights: weightsRes.data || [],
    meals: mealsRes.data || [],
    water: waterRes.data || [],
    exercises: exercisesRes.data || [],
    goal: goalRes.data,
  }
})
