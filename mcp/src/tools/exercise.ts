import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { dateParam, resolveDate } from '../coach.js'

export function registerExerciseTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'log_exercise',
    'Registrar ejercicio realizado. Si el ejercicio está en la base de datos, calcula calorías automáticamente.',
    {
      exercise_name: z.string().describe('Nombre del ejercicio (ej: correr, nadar, pesas)'),
      duration_minutes: z.number().int().positive().describe('Duración en minutos'),
      calories_burned: z.number().int().positive().optional().describe('Calorías quemadas (opcional, se calcula si el ejercicio está en la DB)'),
      notes: z.string().optional().describe('Notas adicionales'),
      date: dateParam,
    },
    async ({ exercise_name, duration_minutes, calories_burned, notes, date }) => {
      const userId = await ctx.userId()
      const today = await resolveDate(ctx, userId, date)

      let calories = calories_burned ?? 0
      let exerciseId: string | null = null

      const { data: exercises } = await ctx.db
        .from('exercises')
        .select('id, name, calories_per_hour')
        .ilike('name', `%${exercise_name}%`)
        .limit(1)

      if (exercises?.length) {
        const ex = exercises[0]
        exerciseId = ex.id
        if (!calories_burned) {
          calories = Math.round(ex.calories_per_hour * (duration_minutes / 60))
        }
      } else if (!calories_burned) {
        return {
          content: [{
            type: 'text' as const,
            text: `⚠️ No encontré "${exercise_name}" en la base de datos. Indica las calorías quemadas con el parámetro calories_burned.`,
          }],
        }
      }

      const { error } = await ctx.db.from('exercise_logs').insert({
        user_id: userId,
        date: today,
        exercise_id: exerciseId,
        exercise_name,
        duration_minutes,
        calories_burned: calories,
        notes,
      })

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      return {
        content: [{
          type: 'text' as const,
          text: `🏃 Ejercicio registrado: ${exercise_name} — ${duration_minutes} min — ${calories} kcal quemadas`,
        }],
      }
    },
  )
}
