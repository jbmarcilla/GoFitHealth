import type { MealType, PortionUnit, GoalType } from './enums'
import type { MealLog, ExerciseLog, WeightLog } from './database'

export interface LogWeightRequest {
  weight_kg: number
  notes?: string
}

export interface LogMealRequest {
  meal_type: MealType
  food_name: string
  quantity: number
  unit: PortionUnit
  food_id?: string
  estimated_calories?: number
  notes?: string
}

export interface LogWaterRequest {
  amount_ml: number
}

export interface LogExerciseRequest {
  exercise_name: string
  duration_minutes: number
  calories_burned: number
  exercise_id?: string
  notes?: string
}

export interface SetGoalRequest {
  goal_type: GoalType
  target_weight_kg?: number
  daily_calorie_target?: number
  daily_water_ml?: number
  notes?: string
}

export interface SearchFoodRequest {
  query: string
  limit?: number
}

export interface AddFoodRequest {
  name: string
  calories_per_100g: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  brand?: string
  sku?: string
  food_category?: string
  serving_reference?: string
}

export interface TodayStatus {
  weight: WeightLog | null
  meals: MealLog[]
  water_total_ml: number
  exercises: ExerciseLog[]
  calories_in: number
  calories_out: number
  missing: string[]
}

export interface DaySummary {
  date: string
  weight_kg: number | null
  calories_in: number
  calories_out: number
  water_ml: number
  meals_count: number
}

export interface WeeklySummary {
  days: DaySummary[]
  totals: {
    avg_calories_in: number
    avg_calories_out: number
    avg_water_ml: number
    total_meals: number
    total_exercises: number
    weight_start: number | null
    weight_end: number | null
    weight_change: number | null
    water_days_complete: number
  }
}

export interface ProgressData {
  weights: Array<{ date: string; weight_kg: number }>
  daily_calories: Array<{ date: string; calories_in: number; calories_out: number }>
  period_days: number
}

export interface GenerateReportRequest {
  scope?: 'weekly' | 'monthly'
}

export interface CalorieEstimate {
  estimated_calories: number
  estimated_grams: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
