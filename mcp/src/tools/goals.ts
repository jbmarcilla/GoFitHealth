import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../db.js'
import { getUserId } from '../auth.js'

const GOAL_LABELS: Record<string, string> = {
  athletic: '🏃 Atlético',
  muscular: '💪 Fornido/Muscular',
  lean: '🧘 Delgado/Definido',
  maintain: '⚖️ Mantener peso',
  lose_weight: '📉 Bajar de peso',
  gain_weight: '📈 Subir de peso',
}

export function registerGoalTools(server: McpServer) {
  server.tool(
    'set_goal',
    'Establecer objetivo de fitness. Desactiva el objetivo anterior automáticamente.',
    {
      goal_type: z.enum(['athletic', 'muscular', 'lean', 'maintain', 'lose_weight', 'gain_weight']).describe('Tipo de objetivo'),
      target_weight_kg: z.number().positive().optional().describe('Peso objetivo en kg'),
      target_muscle_mass_kg: z.number().positive().optional().describe('Masa muscular objetivo en kg'),
      daily_calorie_target: z.number().int().positive().optional().describe('Meta de calorías diarias'),
      daily_water_ml: z.number().int().positive().optional().describe('Meta de agua diaria en ml (default: 2000)'),
      notes: z.string().optional().describe('Notas o detalles del objetivo'),
    },
    async ({ goal_type, target_weight_kg, target_muscle_mass_kg, daily_calorie_target, daily_water_ml, notes }) => {
      const userId = await getUserId()

      await supabase
        .from('goals')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('active', true)

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          goal_type,
          target_weight_kg,
          target_muscle_mass_kg,
          daily_calorie_target,
          daily_water_ml: daily_water_ml ?? 2000,
          notes,
          active: true,
        })
        .select()
        .single()

      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      let text = `🎯 Objetivo establecido: ${GOAL_LABELS[goal_type] ?? goal_type}\n`
      if (target_weight_kg) text += `• Peso objetivo: ${target_weight_kg} kg\n`
      if (target_muscle_mass_kg) text += `• Masa muscular objetivo: ${target_muscle_mass_kg} kg\n`
      if (daily_calorie_target) text += `• Meta calórica: ${daily_calorie_target} kcal/día\n`
      text += `• Meta de agua: ${daily_water_ml ?? 2000} ml/día\n`
      if (notes) text += `• Notas: ${notes}\n`

      return { content: [{ type: 'text' as const, text }] }
    },
  )

  server.tool(
    'update_goal',
    'Cambiar uno o más datos del objetivo actual sin reemplazarlo (ej. solo el peso objetivo). Si no hay objetivo, crea uno (requiere goal_type).',
    {
      goal_type: z.enum(['athletic', 'muscular', 'lean', 'maintain', 'lose_weight', 'gain_weight']).optional().describe('Tipo de objetivo'),
      target_weight_kg: z.number().positive().optional().describe('Peso objetivo en kg'),
      target_muscle_mass_kg: z.number().positive().optional().describe('Masa muscular objetivo en kg'),
      daily_calorie_target: z.number().int().positive().optional().describe('Meta de calorías diarias'),
      daily_water_ml: z.number().int().positive().optional().describe('Meta de agua diaria en ml'),
      notes: z.string().optional().describe('Notas del objetivo'),
    },
    async (fields) => {
      const userId = await getUserId()
      const changes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
      if (!Object.keys(changes).length) {
        return { content: [{ type: 'text' as const, text: '⚠️ No indicaste ningún dato para cambiar.' }] }
      }

      const { data: current } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', userId)
        .eq('active', true)
        .maybeSingle()

      let result
      if (current) {
        result = await supabase.from('goals').update(changes).eq('id', current.id).select().single()
      } else {
        if (!fields.goal_type) {
          return { content: [{ type: 'text' as const, text: '⚠️ El usuario no tiene objetivo. Pregúntale qué quiere lograr e incluye goal_type.' }] }
        }
        result = await supabase.from('goals').insert({ user_id: userId, active: true, ...changes }).select().single()
      }

      if (result.error) return { content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }] }

      const g = result.data
      let text = `🎯 Objetivo actualizado: ${GOAL_LABELS[g.goal_type] ?? g.goal_type}\n`
      text += `• Peso objetivo: ${g.target_weight_kg ? `${g.target_weight_kg} kg` : 'sin definir'}\n`
      text += `• Masa muscular objetivo: ${g.target_muscle_mass_kg ? `${g.target_muscle_mass_kg} kg` : 'sin definir'}\n`
      text += `• Calorías: ${g.daily_calorie_target ? `${g.daily_calorie_target} kcal/día` : 'sin definir'}\n`
      text += `• Agua: ${g.daily_water_ml} ml/día\n`

      return { content: [{ type: 'text' as const, text }] }
    },
  )
}
