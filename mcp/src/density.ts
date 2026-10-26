/**
 * Caloric density: how many calories a food packs per gram.
 * Single source of truth for the traffic-light colors used by the DB
 * (generated column), the MCP responses and the web UI.
 */
export type Density = 'green' | 'yellow' | 'red'

/** Thresholds in kcal per gram (same as the DB: <100, 100–250, >250 kcal/100 g). */
export const DENSITY_THRESHOLDS = { greenMax: 1, yellowMax: 2.5 } as const

export interface DensityInfo {
  key: Density
  emoji: string
  label: string
  short: string
  range: string
  advice: string
  examples: string
  color: string
  badge: string
  dot: string
  border: string
  bg: string
}

export const DENSITY_INFO: Record<Density, DensityInfo> = {
  green: {
    key: 'green',
    emoji: '🟢',
    label: 'Baja densidad',
    short: 'Ligero',
    range: 'menos de 1 kcal por gramo',
    advice: 'Llena mucho con pocas calorías: puedes comer con libertad.',
    examples: 'verduras, frutas, sopas, yogur natural',
    color: '#22c55e',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  yellow: {
    key: 'yellow',
    emoji: '🟡',
    label: 'Media densidad',
    short: 'Moderado',
    range: 'entre 1 y 2.5 kcal por gramo',
    advice: 'Es la base de tu alimentación: cuida la porción (un puño, una palma).',
    examples: 'arroz, pan, pollo, papa, legumbres',
    color: '#eab308',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    border: 'border-l-amber-400',
    bg: 'bg-amber-50 border-amber-100',
  },
  red: {
    key: 'red',
    emoji: '🔴',
    label: 'Alta densidad',
    short: 'Denso',
    range: 'más de 2.5 kcal por gramo',
    advice: 'Mucha energía en poco volumen: disfrútalo en porciones pequeñas.',
    examples: 'frutos secos, aceite, palta, chocolate, queso',
    color: '#ef4444',
    badge: 'bg-rose-100 text-rose-700',
    dot: 'bg-rose-400',
    border: 'border-l-rose-400',
    bg: 'bg-rose-50 border-rose-100',
  },
}

export const DENSITY_ORDER: Density[] = ['green', 'yellow', 'red']

export function densityOf(kcalPerGram: number): Density {
  if (kcalPerGram < DENSITY_THRESHOLDS.greenMax) return 'green'
  if (kcalPerGram <= DENSITY_THRESHOLDS.yellowMax) return 'yellow'
  return 'red'
}

export function densityPer100g(kcalPer100g: number): Density {
  return densityOf(kcalPer100g / 100)
}

export interface DensityResult {
  density: Density
  kcalPerGram: number
  info: DensityInfo
  /** Full explanation with the numbers, e.g. for a tooltip or the AI. */
  explanation: string
}

/** Density of a portion: `kcal` calories in `grams` grams. */
export function densityOfPortion(name: string, kcal: number, grams: number): DensityResult {
  const kcalPerGram = grams > 0 ? kcal / grams : 0
  const density = densityOf(kcalPerGram)
  const info = DENSITY_INFO[density]
  const explanation = `${name}: ${Math.round(kcal)} kcal en ${Math.round(grams)} g = ${kcalPerGram.toFixed(1)} kcal/g → ${info.emoji} ${info.label} (${info.range}). ${info.advice}`
  return { density, kcalPerGram, info, explanation }
}

/** Density of a catalog food from its kcal per 100 g. */
export function densityOfFood(name: string, kcalPer100g: number): DensityResult {
  return densityOfPortion(name, kcalPer100g, 100)
}

/** Short line for MCP/text responses. */
export function densityLine(density: Density, kcalPer100g?: number | null): string {
  const info = DENSITY_INFO[density]
  const num = kcalPer100g ? ` · ${kcalPer100g} kcal/100 g = ${(kcalPer100g / 100).toFixed(1)} kcal/g` : ''
  return `${info.emoji} ${info.label} (${info.range})${num}. ${info.advice}`
}

export const DENSITY_RULE = 'Verde <1 kcal/g · Amarillo 1–2.5 · Rojo >2.5. Ningún alimento es malo: los colores ayudan a elegir la porción.'
