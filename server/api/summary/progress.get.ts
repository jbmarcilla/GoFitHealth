export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const days = Math.min(Number(query.days) || 30, 365)
  const from = new Date(await userToday(user.id) + 'T12:00:00Z')
  from.setUTCDate(from.getUTCDate() - days)
  const fromStr = from.toISOString().split('T')[0]

  const [weightsRes, mealsRes, exercisesRes] = await Promise.all([
    admin.from('weight_logs').select('date, weight_kg').eq('user_id', user.id).gte('date', fromStr).order('date'),
    admin.from('meal_logs').select('date, estimated_calories').eq('user_id', user.id).gte('date', fromStr),
    admin.from('exercise_logs').select('date, calories_burned').eq('user_id', user.id).gte('date', fromStr),
  ])

  const meals = mealsRes.data || []
  const exercises = exercisesRes.data || []

  const caloriesByDate: Record<string, { in: number; out: number }> = {}
  for (const m of meals) {
    if (!caloriesByDate[m.date]) caloriesByDate[m.date] = { in: 0, out: 0 }
    caloriesByDate[m.date].in += m.estimated_calories
  }
  for (const e of exercises) {
    if (!caloriesByDate[e.date]) caloriesByDate[e.date] = { in: 0, out: 0 }
    caloriesByDate[e.date].out += e.calories_burned
  }

  return {
    weights: (weightsRes.data || []).map(w => ({ date: w.date, weight_kg: w.weight_kg })),
    daily_calories: Object.entries(caloriesByDate)
      .map(([date, v]) => ({ date, calories_in: v.in, calories_out: v.out }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    period_days: days,
  }
})
