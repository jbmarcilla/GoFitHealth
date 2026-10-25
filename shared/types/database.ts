import type {
  MeasurementSystem,
  CookingPreference,
  GoalType,
  CaloricDensity,
  MealType,
  PortionUnit,
  ExerciseCategory,
  PortionType,
} from './enums'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  measurement_system: MeasurementSystem
  cooking_preference: CookingPreference
  timezone: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  goal_type: GoalType
  target_weight_kg: number | null
  daily_calorie_target: number | null
  daily_water_ml: number
  notes: string | null
  active: boolean
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight_kg: number
  notes: string | null
  created_at: string
}

export interface Food {
  id: string
  name: string
  brand: string | null
  sku: string | null
  calories_per_100g: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  caloric_density: CaloricDensity
  serving_reference: string | null
  food_category: string | null
  added_by: string | null
  verified: boolean
  created_at: string
}

export interface PortionReference {
  id: string
  food_id: string | null
  food_category: string | null
  portion_type: PortionType
  grams_equivalent: number
  calories_equivalent: number | null
  description: string | null
  verified: boolean
  added_by: string | null
  created_at: string
}

export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: MealType
  food_id: string | null
  food_name: string
  quantity: number
  unit: PortionUnit
  estimated_calories: number
  estimated_protein: number | null
  estimated_carbs: number | null
  estimated_fat: number | null
  notes: string | null
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory | null
  calories_per_hour: number
  met_value: number | null
  added_by: string | null
  created_at: string
}

export interface ExerciseLog {
  id: string
  user_id: string
  date: string
  exercise_id: string | null
  exercise_name: string
  duration_minutes: number
  calories_burned: number
  notes: string | null
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  label: string
  last_used: string | null
  created_at: string
}

export interface ReportToken {
  token: string
  user_id: string
  scope: 'weekly' | 'monthly' | 'all'
  expires_at: string
  created_at: string
}
