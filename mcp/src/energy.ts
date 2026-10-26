export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario (casi sin ejercicio)',
  light: 'Ligero (1–3 días/semana)',
  moderate: 'Moderado (3–5 días/semana)',
  active: 'Activo (6–7 días/semana)',
  very_active: 'Muy activo (trabajo físico o doble sesión)',
}

export interface BodyProfile {
  height_cm?: number | null
  birth_year?: number | null
  sex?: 'male' | 'female' | null
  activity_level?: ActivityLevel | null
}

export interface CaloriePlan {
  target: number
  bmr: number
  tdee: number
  adjustment: number
  direction: 'lose' | 'gain' | 'maintain'
  method: 'mifflin' | 'approx'
  missing: Array<'height_cm' | 'birth_year' | 'sex'>
  weeks_to_goal: number | null
  kg_to_goal: number
}

const round10 = (n: number) => Math.round(n / 10) * 10

/**
 * Daily calorie target from current weight, body data and goal.
 * Recomputed on every weigh-in, so the deficit shrinks as the goal gets closer.
 */
export function calorieTarget(input: {
  weightKg: number
  profile?: BodyProfile | null
  targetKg?: number | null
  goalType?: string | null
}): CaloriePlan {
  const { weightKg, profile, targetKg, goalType } = input
  const missing: CaloriePlan['missing'] = []
  if (!profile?.height_cm) missing.push('height_cm')
  if (!profile?.birth_year) missing.push('birth_year')
  if (!profile?.sex) missing.push('sex')

  let bmr: number
  let method: CaloriePlan['method']
  if (!missing.length) {
    const age = new Date().getFullYear() - Number(profile!.birth_year)
    bmr = 10 * weightKg + 6.25 * Number(profile!.height_cm) - 5 * age + (profile!.sex === 'male' ? 5 : -161)
    method = 'mifflin'
  } else {
    bmr = 22 * weightKg
    method = 'approx'
  }

  const factor = ACTIVITY_FACTORS[(profile?.activity_level as ActivityLevel) || 'light']
  const tdee = bmr * factor

  const diff = targetKg ? targetKg - weightKg : 0
  let direction: CaloriePlan['direction']
  if (targetKg && diff < -0.5) direction = 'lose'
  else if (targetKg && diff > 0.5) direction = 'gain'
  else if (goalType === 'lose_weight' || goalType === 'lean') direction = 'lose'
  else if (goalType === 'gain_weight' || goalType === 'muscular') direction = 'gain'
  else direction = 'maintain'

  const kgToGoal = Math.abs(diff)
  let adjustment = 0
  if (direction === 'lose') adjustment = -(kgToGoal > 5 ? 500 : kgToGoal > 2 ? 400 : kgToGoal > 1 ? 300 : 150)
  if (direction === 'gain') adjustment = kgToGoal > 1 ? 300 : 200

  let target = tdee + adjustment
  target = Math.max(target, bmr, 1200)
  target = round10(target)

  const weeksToGoal = adjustment && targetKg ? Math.round((kgToGoal * 7700) / (Math.abs(adjustment) * 7)) : null

  return { target, bmr: Math.round(bmr), tdee: Math.round(tdee), adjustment, direction, method, missing, weeks_to_goal: weeksToGoal, kg_to_goal: Math.round(kgToGoal * 10) / 10 }
}

/** Protein target: 1.6 g/kg when building muscle or cutting, 1.2 g/kg otherwise. */
export function proteinTarget(weightKg: number, goalType?: string | null): number {
  const perKg = goalType === 'muscular' || goalType === 'athletic' || goalType === 'lean' || goalType === 'lose_weight' ? 1.6 : 1.2
  return Math.round(weightKg * perKg)
}

export function explainPlan(p: CaloriePlan): string {
  const base = p.method === 'mifflin'
    ? `Tu cuerpo gasta ≈ ${p.tdee.toLocaleString('es-PE')} kcal al día (metabolismo ${p.bmr.toLocaleString('es-PE')} × actividad)`
    : `Tu cuerpo gasta ≈ ${p.tdee.toLocaleString('es-PE')} kcal al día (estimado por tu peso)`
  if (p.direction === 'lose') return `${base}. Comiendo ${Math.abs(p.adjustment)} kcal menos bajas ≈ ${(Math.abs(p.adjustment) * 7 / 7700).toFixed(1)} kg por semana${p.weeks_to_goal ? `: llegarías en ≈ ${p.weeks_to_goal} semanas` : ''}. El máximo se recalcula con cada pesada.`
  if (p.direction === 'gain') return `${base}. Con ${p.adjustment} kcal extra subes de forma gradual${p.weeks_to_goal ? ` (≈ ${p.weeks_to_goal} semanas)` : ''}. Se recalcula con cada pesada.`
  return `${base}. Comer alrededor de eso mantiene tu peso.`
}
