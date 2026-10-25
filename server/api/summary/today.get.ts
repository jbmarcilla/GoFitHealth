export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()
  const today = new Date().toISOString().split('T')[0]

  const [weightRes, mealsRes, waterRes, exercisesRes, goalRes] = await Promise.all([
    admin.from('weight_logs').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
    admin.from('meal_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
    admin.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', today),
    admin.from('exercise_logs').select('*').eq('user_id', user.id).eq('date', today).order('created_at'),
    admin.from('goals').select('daily_water_ml').eq('user_id', user.id).eq('active', true).maybeSingle(),
  ])

  const meals = mealsRes.data || []
  const exercises = exercisesRes.data || []
  const waterTotal = (waterRes.data || []).reduce((sum, w) => sum + w.amount_ml, 0)
  const caloriesIn = meals.reduce((sum, m) => sum + m.estimated_calories, 0)
  const caloriesOut = exercises.reduce((sum, e) => sum + e.calories_burned, 0)

  const mealTypes = new Set(meals.map(m => m.meal_type))
  const waterGoal = goalRes.data?.daily_water_ml || 2000
  const missing: string[] = []

  if (!weightRes.data) missing.push('peso')
  if (!mealTypes.has('breakfast')) missing.push('desayuno')
  if (!mealTypes.has('lunch')) missing.push('almuerzo')
  if (!mealTypes.has('dinner')) missing.push('cena')
  if (waterTotal < waterGoal) missing.push(`agua (${waterTotal}/${waterGoal} ml)`)

  return {
    weight: weightRes.data,
    meals,
    water_total_ml: waterTotal,
    exercises,
    calories_in: caloriesIn,
    calories_out: caloriesOut,
    missing,
  }
})
