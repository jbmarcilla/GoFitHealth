import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'
import { getCoachContext, resolveDate } from '../coach.js'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

function getWeekRange(offset: number): { from: string; to: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  }
}

export function registerStatusTools(server: McpServer) {
  server.tool(
    'get_today_status',
    'Llamar al inicio de cada conversación. Resumen de hoy (peso, comidas, agua, ejercicio), qué falta registrar y la personalidad de entrenador que eligió el usuario.',
    {},
    async () => {
      const userId = await getUserId()
      const today = await resolveDate(userId)

      const [weightRes, mealsRes, waterRes, exercisesRes, goalRes, coach] = await Promise.all([
        supabase.from('weight_logs').select('*').eq('user_id', userId).eq('date', today).maybeSingle(),
        supabase.from('meal_logs').select('*').eq('user_id', userId).eq('date', today).order('created_at'),
        supabase.from('water_logs').select('amount_ml').eq('user_id', userId).eq('date', today),
        supabase.from('exercise_logs').select('*').eq('user_id', userId).eq('date', today),
        supabase.from('goals').select('*').eq('user_id', userId).eq('active', true).maybeSingle(),
        getCoachContext(userId),
      ])

      const weight = weightRes.data
      const meals = mealsRes.data ?? []
      const waterTotal = waterRes.data?.reduce((sum: number, l: { amount_ml: number }) => sum + l.amount_ml, 0) ?? 0
      const exercises = exercisesRes.data ?? []
      const goal = goalRes.data

      const waterGoal = goal?.daily_water_ml ?? 2000
      const calorieGoal = goal?.daily_calorie_target ?? 0

      const caloriesIn = meals.reduce((sum: number, m: { estimated_calories: number }) => sum + m.estimated_calories, 0)
      const caloriesOut = exercises.reduce((sum: number, e: { calories_burned: number }) => sum + e.calories_burned, 0)

      const mealsByType: Record<string, Array<{ food_name: string; estimated_calories: number }>> = {}
      for (const m of meals) {
        if (!mealsByType[m.meal_type]) mealsByType[m.meal_type] = []
        mealsByType[m.meal_type].push(m)
      }

      const missing: string[] = []
      if (!weight) missing.push('peso')
      for (const type of ['breakfast', 'lunch', 'dinner']) {
        if (!mealsByType[type]?.length) missing.push(MEAL_LABELS[type].toLowerCase())
      }
      if (waterTotal < waterGoal) missing.push(`agua (faltan ${waterGoal - waterTotal}ml)`)

      let text = `📋 Estado de hoy (${today}):\n\n`

      text += `⚖️ Peso: ${weight ? `${weight.weight_kg} kg` : 'No registrado ❌'}\n\n`

      text += `🍽️ Comidas (${caloriesIn} kcal):\n`
      for (const type of ['breakfast', 'lunch', 'dinner', 'snack']) {
        const items = mealsByType[type]
        if (items?.length) {
          for (const item of items) {
            text += `  • ${MEAL_LABELS[type]}: ${item.food_name} (${item.estimated_calories} kcal)\n`
          }
        } else if (type !== 'snack') {
          text += `  • ${MEAL_LABELS[type]}: No registrado ❌\n`
        }
      }
      if (calorieGoal > 0) {
        text += `  Meta: ${caloriesIn}/${calorieGoal} kcal (${Math.round((caloriesIn / calorieGoal) * 100)}%)\n`
      }

      text += `\n💧 Agua: ${waterTotal}/${waterGoal}ml (${Math.round((waterTotal / waterGoal) * 100)}%)\n`

      if (exercises.length) {
        text += `\n🏃 Ejercicio (${caloriesOut} kcal quemadas):\n`
        for (const e of exercises) {
          text += `  • ${e.exercise_name}: ${e.duration_minutes} min (${e.calories_burned} kcal)\n`
        }
      } else {
        text += `\n🏃 Ejercicio: Ninguno registrado\n`
      }

      if (caloriesIn > 0 || caloriesOut > 0) {
        text += `\n📊 Balance: ${caloriesIn} kcal consumidas - ${caloriesOut} kcal quemadas = ${caloriesIn - caloriesOut} kcal netas\n`
      }

      if (missing.length) {
        text += `\n⚠️ Falta registrar: ${missing.join(', ')}`
      } else {
        text += `\n🎉 ¡Todo registrado hoy!`
      }

      const actions: string[] = []
      if (!coach.hasEverWeighed) {
        actions.push('Nunca registró su peso: pídele su peso actual como punto de partida.')
      } else if (!weight) {
        actions.push('Hoy no se pesó: pregúntale cuánto pesa hoy.')
      }
      if (!goal) {
        actions.push('No tiene objetivo: pregúntale qué quiere lograr (peso objetivo, masa muscular, calorías) y usa set_goal.')
      }
      const pendingMeals = ['breakfast', 'lunch', 'dinner'].filter(t => !mealsByType[t]?.length)
      if (pendingMeals.length) {
        actions.push(`Pregúntale qué comió en: ${pendingMeals.map(t => MEAL_LABELS[t].toLowerCase()).join(', ')} (solo las que ya deberían haber pasado a las ${coach.hour}:00).`)
      }
      if (coach.isNight) {
        actions.push('Es de noche: dale su resumen del día con 1-2 recomendaciones para mañana.')
      }

      text += `\n\n---\n🧑‍🏫 Para el asistente:\n`
      if (coach.name) text += `Usuario: ${coach.name}\n`
      text += `Hora local: ${coach.hour}:00 — hoy es ${coach.today}, ayer fue ${coach.yesterday}\n`
      text += `Personalidad de entrenador: ${coach.trainerPrompt || 'Coach motivador, cercano y positivo. Celebra los logros y da consejos simples.'}\n`
      if (actions.length) text += `Siguientes pasos:\n${actions.map(a => `- ${a}`).join('\n')}`

      return { content: [{ type: 'text' as const, text }] }
    },
  )

  server.tool(
    'get_weekly_summary',
    'Ver resumen semanal: peso, calorías, agua, ejercicio por día. Compara semanas con week_offset.',
    {
      week_offset: z.number().int().default(0).describe('0 = semana actual, -1 = semana pasada, etc.'),
    },
    async ({ week_offset }) => {
      const userId = await getUserId()
      const { from, to } = getWeekRange(week_offset)

      const [weightsRes, mealsRes, waterRes, exercisesRes, goalRes] = await Promise.all([
        supabase.from('weight_logs').select('date, weight_kg').eq('user_id', userId).gte('date', from).lte('date', to).order('date'),
        supabase.from('meal_logs').select('date, estimated_calories, meal_type').eq('user_id', userId).gte('date', from).lte('date', to),
        supabase.from('water_logs').select('date, amount_ml').eq('user_id', userId).gte('date', from).lte('date', to),
        supabase.from('exercise_logs').select('date, calories_burned, duration_minutes').eq('user_id', userId).gte('date', from).lte('date', to),
        supabase.from('goals').select('daily_water_ml, daily_calorie_target').eq('user_id', userId).eq('active', true).maybeSingle(),
      ])

      const weights = weightsRes.data ?? []
      const meals = mealsRes.data ?? []
      const water = waterRes.data ?? []
      const exercises = exercisesRes.data ?? []
      const waterGoal = goalRes.data?.daily_water_ml ?? 2000

      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

      let text = `📊 Resumen semanal (${from} a ${to}):\n\n`
      text += `Día       | Peso   | Cal In | Cal Out | Agua     | Comidas\n`
      text += `----------|--------|--------|---------|----------|--------\n`

      let totalCalIn = 0
      let totalCalOut = 0
      let totalWater = 0
      let totalMeals = 0
      let waterDaysComplete = 0

      for (let i = 0; i < 7; i++) {
        const d = new Date(from)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        const dayName = dayNames[i]

        const w = weights.find((x: { date: string }) => x.date === dateStr)
        const dayMeals = meals.filter((x: { date: string }) => x.date === dateStr)
        const dayWater = water.filter((x: { date: string }) => x.date === dateStr).reduce((s: number, x: { amount_ml: number }) => s + x.amount_ml, 0)
        const dayExercises = exercises.filter((x: { date: string }) => x.date === dateStr)
        const dayCalIn = dayMeals.reduce((s: number, x: { estimated_calories: number }) => s + x.estimated_calories, 0)
        const dayCalOut = dayExercises.reduce((s: number, x: { calories_burned: number }) => s + x.calories_burned, 0)

        totalCalIn += dayCalIn
        totalCalOut += dayCalOut
        totalWater += dayWater
        totalMeals += dayMeals.length
        if (dayWater >= waterGoal) waterDaysComplete++

        const weightStr = w ? `${w.weight_kg}kg` : '—'
        const waterPct = dayWater > 0 ? `${dayWater}ml` : '—'
        const waterCheck = dayWater >= waterGoal ? ' ✅' : ''

        text += `${dayName} ${dateStr.slice(5)} | ${weightStr.padEnd(6)} | ${String(dayCalIn).padEnd(6)} | ${String(dayCalOut).padEnd(7)} | ${waterPct}${waterCheck} | ${dayMeals.length}\n`
      }

      const daysWithData = 7
      text += `\n📈 Totales:\n`
      text += `• Calorías consumidas: ${totalCalIn} (prom: ${Math.round(totalCalIn / daysWithData)}/día)\n`
      text += `• Calorías quemadas: ${totalCalOut} (prom: ${Math.round(totalCalOut / daysWithData)}/día)\n`
      text += `• Agua: ${totalWater}ml total — ${waterDaysComplete}/7 días completos\n`
      text += `• Comidas registradas: ${totalMeals}\n`

      if (weights.length >= 2) {
        const first = weights[0].weight_kg
        const last = weights[weights.length - 1].weight_kg
        const change = last - first
        const sign = change > 0 ? '+' : ''
        text += `• Peso: ${first}kg → ${last}kg (${sign}${change.toFixed(1)}kg)\n`
      }

      if (waterDaysComplete === 7) {
        text += `\n🎉 ¡Felicidades! Tomaste suficiente agua todos los días de la semana.`
      } else if (waterDaysComplete >= 5) {
        text += `\n💪 ¡Buen trabajo con el agua! Solo faltaron ${7 - waterDaysComplete} días.`
      }

      return { content: [{ type: 'text' as const, text }] }
    },
  )
}
