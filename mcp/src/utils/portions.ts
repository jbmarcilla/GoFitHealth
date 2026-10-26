import type { ToolContext } from '../context.js'

const DEFAULT_GRAMS: Record<string, number> = {
  puno: 90,
  palma: 100,
  taza: 200,
  mano: 30,
  cucharada: 15,
  porcion: 100,
}

export async function resolvePortionGrams(
  ctx: ToolContext,
  portionType: string,
  foodId?: string | null,
  foodCategory?: string | null,
): Promise<number> {
  if (foodId) {
    const { data } = await ctx.db
      .from('portion_references')
      .select('grams_equivalent')
      .eq('food_id', foodId)
      .eq('portion_type', portionType)
      .single()

    if (data) return data.grams_equivalent
  }

  if (foodCategory) {
    const { data } = await ctx.db
      .from('portion_references')
      .select('grams_equivalent')
      .eq('food_category', foodCategory)
      .eq('portion_type', portionType)
      .is('food_id', null)
      .single()

    if (data) return data.grams_equivalent
  }

  return DEFAULT_GRAMS[portionType] ?? DEFAULT_GRAMS.porcion
}
