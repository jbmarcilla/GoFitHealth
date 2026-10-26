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
}
