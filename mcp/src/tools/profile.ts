import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { ACTIVITY_LABELS, calorieTarget, explainPlan } from '../energy.js'

export function registerProfileTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'set_body_profile',
    'Guardar estatura, año de nacimiento, sexo y nivel de actividad del usuario. Con esto el máximo de calorías diario se calcula solo (Mifflin-St Jeor) y se recalcula con cada pesada. Pregúntalos una sola vez, de forma natural.',
    {
      height_cm: z.number().min(100).max(250).optional().describe('Estatura en cm'),
      birth_year: z.number().int().min(1900).max(2100).optional().describe('Año de nacimiento (si dice su edad, conviértela)'),
      sex: z.enum(['male', 'female']).optional().describe('Sexo biológico, para la fórmula de metabolismo'),
      activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional().describe('Actividad semanal habitual: sedentary (nada), light (1–3 días), moderate (3–5), active (6–7), very_active (trabajo físico)'),
    },
    async (fields) => {
      const userId = await ctx.userId()
      const changes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
      if (!Object.keys(changes).length) return { content: [{ type: 'text' as const, text: '⚠️ No indicaste ningún dato.' }] }

      const { error } = await ctx.db.from('profiles').update(changes).eq('id', userId)
      if (error) return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }] }

      const [{ data: profile }, { data: weight }, { data: goal }] = await Promise.all([
        ctx.db.from('profiles').select('height_cm, birth_year, sex, activity_level').eq('id', userId).maybeSingle(),
        ctx.db.from('weight_logs').select('weight_kg').eq('user_id', userId).order('date', { ascending: false }).limit(1).maybeSingle(),
        ctx.db.from('goals').select('goal_type, target_weight_kg, daily_calorie_target').eq('user_id', userId).eq('active', true).maybeSingle(),
      ])

      let text = `✅ Datos corporales guardados`
      if (profile?.height_cm) text += ` · ${profile.height_cm} cm`
      if (profile?.birth_year) text += ` · ${new Date().getFullYear() - profile.birth_year} años`
      if (profile?.activity_level) text += ` · ${ACTIVITY_LABELS[profile.activity_level as keyof typeof ACTIVITY_LABELS]}`
      if (weight?.weight_kg) {
        const plan = calorieTarget({ weightKg: Number(weight.weight_kg), profile, targetKg: goal?.target_weight_kg ? Number(goal.target_weight_kg) : null, goalType: goal?.goal_type })
        text += `\n\n🎯 Máximo diario calculado: ${plan.target.toLocaleString('es-PE')} kcal\n${explainPlan(plan)}`
        if (goal?.daily_calorie_target) text += `\n(El usuario tiene una meta manual de ${goal.daily_calorie_target} kcal que tiene prioridad; ofrécele usar la calculada con update_goal si prefiere.)`
      }
      return { content: [{ type: 'text' as const, text }] }
    },
  )
}
