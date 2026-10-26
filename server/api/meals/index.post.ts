import { FOOD_SELECT, type FoodRow, type MealNutrition, insertMealLog, nutritionFromFood, sanitizeNutrients } from '../../../mcp/src/nutrition'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const admin = useSupabaseAdmin() as any

  if (!body?.meal_type || !body?.food_name || !body?.quantity || !body?.unit) {
    throw createError({ statusCode: 400, message: 'meal_type, food_name, quantity y unit son requeridos' })
  }

  let food: FoodRow | null = null
  if (body.food_id) {
    const { data } = await admin.from('foods').select(FOOD_SELECT).eq('id', body.food_id).maybeSingle()
    food = data
  } else {
    const { data } = await admin.from('foods').select(FOOD_SELECT).ilike('name', `%${body.food_name}%`).limit(1)
    food = data?.[0] ?? null
  }

  let nutrition: MealNutrition
  if (food) {
    const estimate = await estimateCalories(food, body.quantity, body.unit, food.id, food.food_category)
    nutrition = await nutritionFromFood(admin, food, estimate.estimated_grams)
    if (body.estimated_calories) nutrition.calories = Number(body.estimated_calories)
  } else {
    if (!body.estimated_calories) {
      throw createError({ statusCode: 400, message: 'No encontré ese alimento. Indica las calorías aproximadas.' })
    }
    nutrition = {
      grams: body.unit === 'g' || body.unit === 'ml' ? Number(body.quantity) : null,
      calories: Number(body.estimated_calories),
      protein_g: body.protein_g ?? null,
      carbs_g: body.carbs_g ?? null,
      fat_g: body.fat_g ?? null,
      fiber_g: body.fiber_g ?? null,
      nutrients: await sanitizeNutrients(admin, body.nutrients),
    }
  }

  const today = await userToday(user.id)

  try {
    return await insertMealLog(admin, {
      user_id: user.id,
      date: today,
      meal_type: body.meal_type,
      food_id: food?.id ?? null,
      food_name: body.food_name,
      quantity: body.quantity,
      unit: body.unit,
      notes: body.notes || null,
    }, nutrition)
  } catch (e: any) {
    throw createError({ statusCode: 500, message: `Error al registrar comida: ${e.message}` })
  }
})
