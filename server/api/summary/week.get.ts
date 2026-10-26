import { calorieTarget } from '../../../mcp/src/energy'

/** Per-day status of a date range: did the person stay within their calorie max? */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const admin = useSupabaseAdmin()
  const q = getQuery(event)
  const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (!isDate(q.from) || !isDate(q.to)) throw createError({ statusCode: 400, message: 'from y to (YYYY-MM-DD) son requeridos' })
  const from = q.from
  const to = q.to

  const [mealsRes, exRes, weightsRes, goalRes, profileRes] = await Promise.all([
    admin.from('meal_logs').select('date, estimated_calories').eq('user_id', user.id).gte('date', from).lte('date', to),
    admin.from('exercise_logs').select('date, calories_burned').eq('user_id', user.id).gte('date', from).lte('date', to),
    admin.from('weight_logs').select('date, weight_kg').eq('user_id', user.id).order('date'),
    admin.from('goals').select('goal_type, target_weight_kg, daily_calorie_target').eq('user_id', user.id).eq('active', true).maybeSingle(),
    admin.from('profiles').select('height_cm, birth_year, sex, activity_level').eq('id', user.id).maybeSingle(),
  ])

  const weights = weightsRes.data ?? []
  const goal = goalRes.data
  const weightFor = (date: string) => {
    const before = weights.filter(w => w.date <= date)
    const w = before.length ? before[before.length - 1] : weights[0]
    return w ? Number(w.weight_kg) : 0
  }

  const days: Record<string, { calories_in: number; calories_out: number; meals: number }> = {}
  for (const m of mealsRes.data ?? []) {
    days[m.date] ??= { calories_in: 0, calories_out: 0, meals: 0 }
    days[m.date].calories_in += m.estimated_calories
    days[m.date].meals++
  }
  for (const e of exRes.data ?? []) {
    days[e.date] ??= { calories_in: 0, calories_out: 0, meals: 0 }
    days[e.date].calories_out += e.calories_burned
  }

  return Object.entries(days).map(([date, d]) => {
    const kg = weightFor(date)
    const target = goal?.daily_calorie_target
      ?? (kg ? calorieTarget({ weightKg: kg, profile: profileRes.data, targetKg: goal?.target_weight_kg ? Number(goal.target_weight_kg) : null, goalType: goal?.goal_type }).target : null)
    const remaining = target ? target - d.calories_in + d.calories_out : null
    return { date, ...d, target, remaining, met: remaining !== null && d.meals > 0 ? remaining >= 0 : null }
  })
})
