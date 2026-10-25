import type { PortionUnit } from '../../shared/types'
import { DEFAULT_PORTION_GRAMS } from '../../shared/constants/portions'
import { PORTION_TYPES } from '../../shared/types/enums'

interface FoodInput {
  calories_per_100g: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
}

export interface CalorieEstimate {
  estimated_calories: number
  estimated_grams: number
}

export async function estimateCalories(
  food: FoodInput,
  quantity: number,
  unit: PortionUnit,
  foodId?: string | null,
  foodCategory?: string | null,
): Promise<CalorieEstimate> {
  let grams: number

  if (unit === 'g' || unit === 'ml') {
    grams = quantity
  } else if (PORTION_TYPES.includes(unit as any)) {
    grams = await resolvePortionGrams(unit, foodId, foodCategory)
    grams = grams * quantity
  } else {
    grams = quantity * (DEFAULT_PORTION_GRAMS.porcion ?? 100)
  }

  const estimated_calories = Math.round((grams / 100) * food.calories_per_100g)
  return { estimated_calories, estimated_grams: Math.round(grams) }
}

async function resolvePortionGrams(
  portionType: PortionUnit,
  foodId?: string | null,
  foodCategory?: string | null,
): Promise<number> {
  const admin = useSupabaseAdmin()

  if (foodId) {
    const { data } = await admin
      .from('portion_references')
      .select('grams_equivalent')
      .eq('food_id', foodId)
      .eq('portion_type', portionType)
      .single()

    if (data) return data.grams_equivalent
  }

  if (foodCategory) {
    const { data } = await admin
      .from('portion_references')
      .select('grams_equivalent')
      .eq('food_category', foodCategory)
      .eq('portion_type', portionType)
      .is('food_id', null)
      .single()

    if (data) return data.grams_equivalent
  }

  return DEFAULT_PORTION_GRAMS[portionType] ?? DEFAULT_PORTION_GRAMS.porcion
}
