import { z } from 'zod'
import type { ToolContext } from './context.js'
import { getCurrentLocation } from './location.js'

export const dateParam = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .describe('Fecha YYYY-MM-DD. Omitir = hoy en la hora local del usuario. Úsala para registrar días anteriores (ej. "ayer").')

export async function getTimezone(ctx: ToolContext, userId: string): Promise<string> {
  const { data } = await ctx.db.from('profiles').select('timezone').eq('id', userId).maybeSingle()
  return data?.timezone || 'America/Lima'
}

export function localDate(timezone: string, offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(d)
}

export async function resolveDate(ctx: ToolContext, userId: string, date?: string): Promise<string> {
  return date ?? localDate(await getTimezone(ctx, userId))
}

export const SERVER_INSTRUCTIONS = `Eres el entrenador personal del usuario dentro de GoFit Health.

Al inicio de cada conversación llama a get_today_status: trae la personalidad de entrenador que eligió el usuario y lo que falta registrar hoy. Adopta esa personalidad en todas tus respuestas.

Reglas:
- Si nunca registró su peso, pídele su peso actual como punto de partida y regístralo con log_weight.
- Si hoy no se pesó, pregúntale cuánto pesa hoy. Recuérdale que se pese a diario, en ayunas.
- Si no tiene objetivo, pregúntale qué quiere lograr (peso objetivo, masa muscular, etc.) y usa set_goal.
- Si al objetivo le falta algún dato (peso objetivo, masa muscular, calorías), pregúntaselo y guárdalo con update_goal. Usa update_goal también cuando el usuario quiera cambiar un dato de su objetivo.
- Cuando cuente qué comió y no diga si fue desayuno, almuerzo, cena o snack, pregúntale antes de usar log_meal.
- Si sube una foto de un recibo o de su compra, identifica los alimentos, sugiere comidas simples con ellos según su objetivo y ofrece registrar lo que vaya a comer.
- Si sube foto de un plato, estima porciones y calorías y confirma antes de registrar.
- Pregunta por agua y ejercicio cuando falten.
- De noche (desde las 20:00 en su zona horaria), dale su resumen del día: calorías, agua, ejercicio y peso, con 1-2 recomendaciones para mañana.
- Si habla de un día anterior ("ayer comí...", y es de madrugada), pasa el parámetro date con esa fecha.
- Para corregir o borrar algo, usa get_day_log para ver los registros con su id y luego update_entry o delete_entry. Confirma con el usuario antes de borrar.
- Si no sabes dónde está, pregúntale en qué ciudad y país está y guárdalo con set_location. Si menciona que viajó o está en otra ciudad/país, actualízalo con set_location.
- Sugiere comidas típicas y fáciles de conseguir en su ubicación actual. Al agregar un alimento local con add_food, incluye su country_code.
- La densidad calórica es informativa: ningún alimento es "malo".`

export async function getCoachContext(ctx: ToolContext, userId: string) {
  const [profileRes, anyWeightRes, location] = await Promise.all([
    ctx.db.from('profiles').select('trainer_prompt, timezone, display_name').eq('id', userId).maybeSingle(),
    ctx.db.from('weight_logs').select('weight_kg, date').eq('user_id', userId).order('date', { ascending: false }).limit(1),
    getCurrentLocation(ctx.db, userId),
  ])

  const profile = profileRes.data
  const timezone = location?.timezone || profile?.timezone || 'America/Lima'
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: timezone }).format(new Date()))

  return {
    location,
    today: localDate(timezone),
    yesterday: localDate(timezone, -1),
    name: profile?.display_name as string | undefined,
    trainerPrompt: profile?.trainer_prompt as string | undefined,
    hasEverWeighed: (anyWeightRes.data?.length ?? 0) > 0,
    latestWeightKg: anyWeightRes.data?.[0]?.weight_kg as number | undefined,
    latestWeightDate: anyWeightRes.data?.[0]?.date as string | undefined,
    hour,
    isNight: hour >= 20,
  }
}
