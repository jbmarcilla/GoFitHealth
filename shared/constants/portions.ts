import type { PortionType } from '../types/enums'

export const DEFAULT_PORTION_GRAMS: Record<PortionType, number> = {
  puno: 90,
  palma: 100,
  taza: 200,
  mano: 30,
  cucharada: 15,
  porcion: 100,
}

export const PORTION_LABELS: Record<PortionType, string> = {
  puno: 'Puño',
  palma: 'Palma',
  taza: 'Taza',
  mano: 'Mano',
  cucharada: 'Cucharada',
  porcion: 'Porción',
}

export const PORTION_DESCRIPTIONS: Record<PortionType, string> = {
  puno: 'Puño cerrado — ideal para medir granos, frutas y verduras (~90g)',
  palma: 'Palma de la mano sin dedos — para proteínas como carne, pollo o pescado (~100g)',
  taza: 'Taza estándar de 240ml — para líquidos, cereales y arroz cocido (~200g sólidos)',
  mano: 'Un puñado con la mano abierta — para snacks, frutos secos y semillas (~30g)',
  cucharada: 'Cuchara sopera — para aceites, mantequilla y salsas (~15g)',
  porcion: 'Porción estándar según el alimento (~100g por defecto)',
}
