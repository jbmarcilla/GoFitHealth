export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.name || body?.calories_per_100g == null) {
    throw createError({ statusCode: 400, message: 'name y calories_per_100g son requeridos' })
  }

  const { data: existing } = await admin
    .from('foods')
    .select('id, name, brand')
    .ilike('name', body.name)
    .ilike('brand', body.brand || '')
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { existing: true, food: existing, message: 'Este alimento ya existe en la base de datos' }
  }

  const { data, error } = await admin
    .from('foods')
    .insert({
      name: body.name,
      calories_per_100g: body.calories_per_100g,
      protein_g: body.protein_g || 0,
      carbs_g: body.carbs_g || 0,
      fat_g: body.fat_g || 0,
      brand: body.brand || null,
      sku: body.sku || null,
      food_category: body.food_category || null,
      serving_reference: body.serving_reference || null,
      added_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al agregar alimento' })
  }

  return data
})
