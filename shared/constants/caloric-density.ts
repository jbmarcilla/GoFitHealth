import type { CaloricDensity } from '../types/enums'

export const CALORIC_DENSITY_THRESHOLDS = {
  green: { max: 100 },
  yellow: { min: 100, max: 250 },
  red: { min: 250 },
} as const

export const CALORIC_DENSITY_LABELS: Record<CaloricDensity, string> = {
  green: 'Baja densidad',
  yellow: 'Media densidad',
  red: 'Alta densidad',
}

export const CALORIC_DENSITY_COLORS: Record<CaloricDensity, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
}

export const CALORIC_DENSITY_DESCRIPTIONS: Record<CaloricDensity, string> = {
  green: 'Alimentos que llenan mucho con pocas calorías (frutas, verduras, sopas)',
  yellow: 'Balance moderado entre volumen y calorías (pan, arroz, carne magra)',
  red: 'Alta concentración calórica en poco volumen (frutos secos, aceites, chocolate)',
}

export function getCaloricDensityColor(caloriesPer100g: number): CaloricDensity {
  if (caloriesPer100g < 100) return 'green'
  if (caloriesPer100g <= 250) return 'yellow'
  return 'red'
}
