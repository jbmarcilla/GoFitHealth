import { summarizeNutrition } from '../../../mcp/src/nutrition'
import { calorieTarget, proteinTarget } from '../../../mcp/src/energy'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()
  const query = getQuery(event)
  const date = (query.date as string)?.match(/^\d{4}-\d{2}-\d{2}$/) ? (query.date as string) : await userToday(user.id)

  const [weightRes, mealsRes, waterRes, exercisesRes, goalRes, profileRes, lastWeightRes] = await Promise.all([
    admin.from('weight_logs').select('*').eq('user_id', user.id).eq('date', date).maybeSingle(),
    admin.from('meal_logs').select('*, foods!food_id(food_category, caloric_density)').eq('user_id', user.id).eq('date', date).order('created_at'),
    admin.from('water_logs').select('amount_ml').eq('user_id', user.id).eq('date', date),
    admin.from('exercise_logs').select('*').eq('user_id', user.id).eq('date', date).order('created_at'),
    admin.from('goals').select('goal_type, target_weight_kg, target_muscle_mass_kg, daily_calorie_target, daily_protein_g, daily_water_ml').eq('user_id', user.id).eq('active', true).maybeSingle(),
    admin.from('profiles').select('height_cm, birth_year, sex, activity_level').eq('id', user.id).maybeSingle(),
    admin.from('weight_logs').select('weight_kg').eq('user_id', user.id).lte('date', date).order('date', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Calorie max: manual if the goal has one, otherwise computed from the closest weigh-in
  // (the last one at or before the date; for days before the first weigh-in, the first one).
  const goal = goalRes.data ? { ...goalRes.data } : null
  let weightKg = Number(weightRes.data?.weight_kg ?? lastWeightRes.data?.weight_kg ?? 0)
  if (!weightKg) {
    const { data: first } = await admin.from('weight_logs').select('weight_kg').eq('user_id', user.id).order('date').limit(1).maybeSingle()
    weightKg = Number(first?.weight_kg ?? 0)
  }
  let caloriePlan = null
  if (weightKg > 0) {
    caloriePlan = calorieTarget({ weightKg, profile: profileRes.data, targetKg: goal?.target_weight_kg ? Number(goal.target_weight_kg) : null, goalType: goal?.goal_type })
    if (goal && !goal.daily_calorie_target) goal.daily_calorie_target = caloriePlan.target
    if (goal && !goal.daily_protein_g) goal.daily_protein_g = proteinTarget(weightKg, goal.goal_type)
  }

  const meals = mealsRes.data || []
  const exercises = exercisesRes.data || []
  const waterTotal = (waterRes.data || []).reduce((sum, w) => sum + w.amount_ml, 0)
  const caloriesIn = meals.reduce((sum, m) => sum + m.estimated_calories, 0)
  const caloriesOut = exercises.reduce((sum, e) => sum + e.calories_burned, 0)

  const mealTypes = new Set(meals.map(m => m.meal_type))
  const waterGoal = goal?.daily_water_ml || 2000
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
    goal: goal ?? (caloriePlan ? { daily_calorie_target: caloriePlan.target, daily_protein_g: proteinTarget(weightKg), daily_water_ml: 2000 } : null),
    calorie_plan: caloriePlan ? { ...caloriePlan, auto: !goalRes.data?.daily_calorie_target } : null,
    date,
    nutrition: meals.length ? await summarizeNutrition(admin as any, user.id, date, date, 1) : null,
  }
})
