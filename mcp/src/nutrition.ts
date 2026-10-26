import type { SupabaseClient } from '@supabase/supabase-js'

export interface NutrientDef {
  key: string
  name: string
  unit: 'g' | 'mg' | 'mcg'
  category: 'macro' | 'vitamin' | 'mineral' | 'other'
  daily_reference: number | null
  is_limit: boolean
  sort_order: number
}

export interface Macros {
  calories: number
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
}

export interface MealNutrition extends Macros {
  grams: number | null
  nutrients: Record<string, number>
}

export interface FoodRow {
  id: string
  name: string
  calories_per_100g: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  caloric_density: string
  food_category: string | null
}

export const FOOD_SELECT = 'id, name, calories_per_100g, protein_g, carbs_g, fat_g, fiber_g, caloric_density, food_category'

const round1 = (n: number) => Math.round(n * 10) / 10
const round3 = (n: number) => Math.round(n * 1000) / 1000

let _defs: NutrientDef[] | null = null
export async function getNutrientDefs(db: SupabaseClient): Promise<NutrientDef[]> {
  if (_defs) return _defs
  const { data } = await db.from('nutrients').select('*').order('sort_order')
  _defs = (data ?? []) as NutrientDef[]
  return _defs
}

/** Scales a food's macros and micronutrients (per 100 g) to the grams eaten. */
export async function nutritionFromFood(db: SupabaseClient, food: FoodRow, grams: number): Promise<MealNutrition> {
  const ratio = grams / 100
  const { data: rows } = await db.from('food_nutrients').select('nutrient_key, amount_per_100g').eq('food_id', food.id)
  const nutrients: Record<string, number> = {}
  for (const r of rows ?? []) nutrients[r.nutrient_key] = round3(Number(r.amount_per_100g) * ratio)

  return {
    grams: round1(grams),
    calories: Math.round(food.calories_per_100g * ratio),
    protein_g: round1(food.protein_g * ratio),
    carbs_g: round1(food.carbs_g * ratio),
    fat_g: round1(food.fat_g * ratio),
    fiber_g: round1((food.fiber_g ?? 0) * ratio),
    nutrients,
  }
}

/** Keeps only known nutrient keys, so a typo never breaks an insert. */
export async function sanitizeNutrients(db: SupabaseClient, input?: Record<string, number> | null): Promise<Record<string, number>> {
  if (!input) return {}
  const known = new Set((await getNutrientDefs(db)).map(d => d.key))
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(input)) {
    if (known.has(k) && Number.isFinite(v) && v >= 0) out[k] = round3(v)
  }
  return out
}

export async function insertMealLog(
  db: SupabaseClient,
  row: {
    user_id: string
    date: string
    meal_type: string
    food_id: string | null
    food_name: string
    quantity: number
    unit: string
    notes?: string | null
  },
  nutrition: MealNutrition,
) {
  const { data, error } = await db
    .from('meal_logs')
    .insert({
      ...row,
      notes: row.notes ?? null,
      estimated_grams: nutrition.grams,
      estimated_calories: nutrition.calories,
      estimated_protein: nutrition.protein_g,
      estimated_carbs: nutrition.carbs_g,
      estimated_fat: nutrition.fat_g,
      estimated_fiber: nutrition.fiber_g,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'No se pudo registrar la comida')

  const entries = Object.entries(nutrition.nutrients)
  if (entries.length) {
    const { error: nErr } = await db
      .from('meal_nutrients')
      .insert(entries.map(([nutrient_key, amount]) => ({ meal_log_id: data.id, nutrient_key, amount })))
    if (nErr) throw new Error(nErr.message)
  }
  return data
}

export async function upsertFoodNutrients(
  db: SupabaseClient,
  foodId: string,
  nutrients: Record<string, number>,
  userId: string,
) {
  const entries = Object.entries(nutrients)
  if (!entries.length) return 0
  const { error } = await db.from('food_nutrients').upsert(
    entries.map(([nutrient_key, amount_per_100g]) => ({
      food_id: foodId,
      nutrient_key,
      amount_per_100g,
      added_by: userId,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'food_id,nutrient_key' },
  )
  if (error) throw new Error(error.message)
  return entries.length
}

export interface NutrientTotal extends NutrientDef {
  amount: number
  percent: number | null
}

export interface NutritionSummary {
  days: number
  meals: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  nutrients: NutrientTotal[]
}

/** Totals for a date range (inclusive). Averages are per day with the given `days`. */
export async function summarizeNutrition(
  db: SupabaseClient,
  userId: string,
  from: string,
  to: string,
  days: number,
): Promise<NutritionSummary> {
  const [mealsRes, nutRes, defs] = await Promise.all([
    db.from('meal_logs')
      .select('estimated_calories, estimated_protein, estimated_carbs, estimated_fat, estimated_fiber')
      .eq('user_id', userId).gte('date', from).lte('date', to),
    db.from('meal_nutrients')
      .select('nutrient_key, amount, meal_logs!inner(user_id, date)')
      .eq('meal_logs.user_id', userId).gte('meal_logs.date', from).lte('meal_logs.date', to),
    getNutrientDefs(db),
  ])

  const meals = mealsRes.data ?? []
  const sum = (k: string) => meals.reduce((s: number, m: any) => s + Number(m[k] ?? 0), 0)

  const byKey: Record<string, number> = {}
  for (const r of (nutRes.data ?? []) as any[]) byKey[r.nutrient_key] = (byKey[r.nutrient_key] ?? 0) + Number(r.amount)
  // fiber lives in meal_logs; expose it through the same list so the UI treats it uniformly
  byKey.fiber = (byKey.fiber ?? 0) + sum('estimated_fiber')

  const nutrients: NutrientTotal[] = defs
    .filter(d => byKey[d.key] !== undefined && byKey[d.key] > 0)
    .map((d) => {
      const perDay = byKey[d.key] / days
      return { ...d, amount: round3(perDay), percent: d.daily_reference ? Math.round((perDay / Number(d.daily_reference)) * 100) : null }
    })

  return {
    days,
    meals: meals.length,
    calories: Math.round(sum('estimated_calories') / days),
    protein_g: round1(sum('estimated_protein') / days),
    carbs_g: round1(sum('estimated_carbs') / days),
    fat_g: round1(sum('estimated_fat') / days),
    fiber_g: round1(sum('estimated_fiber') / days),
    nutrients,
  }
}

export function formatAmount(n: NutrientTotal | { amount: number; unit: string }) {
  const v = n.amount
  const s = v >= 100 ? Math.round(v).toString() : v >= 10 ? v.toFixed(1) : v.toFixed(2).replace(/\.?0+$/, '')
  return `${s} ${n.unit}`
}
