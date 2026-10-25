export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-PE').format(n)
}

export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

export const UNIT_LABELS: Record<string, string> = {
  g: 'g',
  ml: 'ml',
  puno: 'puño',
  taza: 'taza',
  mano: 'mano',
  cucharada: 'cda',
  porcion: 'porción',
  unit: 'und',
}
