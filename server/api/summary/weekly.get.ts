export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const offset = Number(query.offset) || 0

  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + (offset * 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const from = monday.toISOString().split('T')[0]
  const to = sunday.toISOString().split('T')[0]

  const [weightsRes, mealsRes, waterRes, exercisesRes] = await Promise.all([
    admin.from('weight_logs').select('date, weight_kg').eq('user_id', user.id).gte('date', from).lte('date', to).order('date'),
    admin.from('meal_logs').select('date, estimated_calories, meal_type').eq('user_id', user.id).gte('date', from).lte('date', to),
    admin.from('water_logs').select('date, amount_ml').eq('user_id', user.id).gte('date', from).lte('date', to),
    admin.from('exercise_logs').select('date, calories_burned').eq('user_id', user.id).gte('date', from).lte('date', to),
  ])

  const weights = weightsRes.data || []
  const meals = mealsRes.data || []
  const waterLogs = waterRes.data || []
  const exercises = exercisesRes.data || []

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const date = d.toISOString().split('T')[0]

    const dayWeight = weights.find(w => w.date === date)
    const dayMeals = meals.filter(m => m.date === date)
    const dayWater = waterLogs.filter(w => w.date === date)
    const dayExercises = exercises.filter(e => e.date === date)

    days.push({
      date,
      weight_kg: dayWeight?.weight_kg || null,
      calories_in: dayMeals.reduce((s, m) => s + m.estimated_calories, 0),
      calories_out: dayExercises.reduce((s, e) => s + e.calories_burned, 0),
      water_ml: dayWater.reduce((s, w) => s + w.amount_ml, 0),
      meals_count: dayMeals.length,
    })
  }

  const daysWithData = days.filter(d => d.calories_in > 0 || d.weight_kg)
  const count = daysWithData.length || 1

  return {
    days,
    totals: {
      avg_calories_in: Math.round(days.reduce((s, d) => s + d.calories_in, 0) / count),
      avg_calories_out: Math.round(days.reduce((s, d) => s + d.calories_out, 0) / count),
      avg_water_ml: Math.round(days.reduce((s, d) => s + d.water_ml, 0) / count),
      total_meals: meals.length,
      total_exercises: exercises.length,
      weight_start: weights[0]?.weight_kg || null,
      weight_end: weights[weights.length - 1]?.weight_kg || null,
      weight_change: weights.length >= 2
        ? Math.round((weights[weights.length - 1].weight_kg - weights[0].weight_kg) * 100) / 100
        : null,
      water_days_complete: days.filter(d => d.water_ml >= 2000).length,
    },
  }
})
