export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin()

  if (!body?.meal_type || !body?.food_name || !body?.quantity || !body?.unit) {
    throw createError({ statusCode: 400, message: 'meal_type, food_name, quantity y unit son requeridos' })
  }

  let calories = body.estimated_calories as number | undefined
  let protein: number | null = null
  let carbs: number | null = null
  let fat: number | null = null

  if (body.food_id) {
    const { data: food } = await admin
      .from('foods')
      .select('*')
      .eq('id', body.food_id)
      .single()

    if (food) {
      const estimate = await estimateCalories(
        food,
        body.quantity,
        body.unit,
        body.food_id,
        food.food_category,
      )
      if (!calories) calories = estimate.estimated_calories
      const ratio = estimate.estimated_grams / 100
      protein = Math.round(food.protein_g * ratio * 10) / 10
      carbs = Math.round(food.carbs_g * ratio * 10) / 10
      fat = Math.round(food.fat_g * ratio * 10) / 10
    }
  }

  if (!calories) {
    throw createError({ statusCode: 400, message: 'No se pudo estimar calorías. Proporciona food_id o estimated_calories.' })
  }

  const today = await userToday(user.id)

  const { data, error } = await admin
    .from('meal_logs')
    .insert({
      user_id: user.id,
      date: today,
      meal_type: body.meal_type,
      food_id: body.food_id || null,
      food_name: body.food_name,
      quantity: body.quantity,
      unit: body.unit,
      estimated_calories: calories,
      estimated_protein: protein,
      estimated_carbs: carbs,
      estimated_fat: fat,
      notes: body.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al registrar comida' })
  }

  return data
})
