import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from '../context.js'
import { getCoachContext, resolveDate } from '../coach.js'
import { calorieTarget, proteinTarget } from '../energy.js'
import { createLoginLink } from '../magic.js'
import { REMAINING_WIDGET_HTML, REMAINING_WIDGET_URI, REMAINING_WIDGET_URI_CHATGPT } from '../widget.js'

export function registerCardTools(server: McpServer, ctx: ToolContext) {
  server.registerResource('remaining-card', REMAINING_WIDGET_URI, {
    title: 'Restante de hoy',
    description: 'Tarjeta con el restante de calorías del día y acceso al dashboard',
    mimeType: 'text/html;profile=mcp-app',
  }, async () => ({
    contents: [{ uri: REMAINING_WIDGET_URI, mimeType: 'text/html;profile=mcp-app', text: REMAINING_WIDGET_HTML }],
  }))

  server.registerResource('remaining-card-chatgpt', REMAINING_WIDGET_URI_CHATGPT, {
    title: 'Restante de hoy',
    mimeType: 'text/html+skybridge',
  }, async () => ({
    contents: [{ uri: REMAINING_WIDGET_URI_CHATGPT, mimeType: 'text/html+skybridge', text: REMAINING_WIDGET_HTML }],
  }))

  server.registerTool(
    'show_remaining',
    {
      title: 'Restante de hoy',
      description: 'Muestra una tarjeta visual en el chat con el restante de calorías de hoy (máximo − comida + ejercicio) y un botón "Ver completo" que abre el dashboard ya logueado. Úsala cuando el usuario pida ver su progreso, cuánto le queda, cómo va o su dashboard.',
      inputSchema: {},
      _meta: {
        'openai/outputTemplate': REMAINING_WIDGET_URI_CHATGPT,
        'openai/toolInvocation/invoking': 'Calculando tu restante…',
        'openai/toolInvocation/invoked': 'Aquí va tu día',
        ui: { resourceUri: REMAINING_WIDGET_URI },
      },
    },
    async () => {
      const userId = await ctx.userId()
      const today = await resolveDate(ctx, userId)
      const [mealsRes, exRes, weightRes, goalRes, bodyRes, coach] = await Promise.all([
        ctx.db.from('meal_logs').select('estimated_calories, estimated_protein').eq('user_id', userId).eq('date', today),
        ctx.db.from('exercise_logs').select('calories_burned').eq('user_id', userId).eq('date', today),
        ctx.db.from('weight_logs').select('weight_kg').eq('user_id', userId).eq('date', today).maybeSingle(),
        ctx.db.from('goals').select('goal_type, target_weight_kg, daily_calorie_target, daily_protein_g').eq('user_id', userId).eq('active', true).maybeSingle(),
        ctx.db.from('profiles').select('height_cm, birth_year, sex, activity_level').eq('id', userId).maybeSingle(),
        getCoachContext(ctx, userId),
      ])

      const meals = mealsRes.data ?? []
      const consumed = meals.reduce((s: number, m: any) => s + Number(m.estimated_calories), 0)
      const protein = meals.reduce((s: number, m: any) => s + Number(m.estimated_protein ?? 0), 0)
      const burned = (exRes.data ?? []).reduce((s: number, e: any) => s + Number(e.calories_burned), 0)
      const goal = goalRes.data
      const weightKg = Number(weightRes.data?.weight_kg ?? coach.latestWeightKg ?? 0)
      const plan = weightKg > 0
        ? calorieTarget({ weightKg, profile: bodyRes.data, targetKg: goal?.target_weight_kg ? Number(goal.target_weight_kg) : null, goalType: goal?.goal_type })
        : null
      const max: number | null = goal?.daily_calorie_target ?? plan?.target ?? null
      const proteinGoal = goal?.daily_protein_g ?? (weightKg > 0 ? proteinTarget(weightKg, goal?.goal_type) : null)
      const remaining = max !== null ? max - consumed + burned : null

      let link: string | null = null
      try { link = await createLoginLink(ctx.db, userId, ctx.siteUrl) } catch { link = `${ctx.siteUrl}/dashboard` }

      const data = { label: 'Hoy', date: today, consumed, burned, max, remaining, protein: Math.round(protein), protein_goal: proteinGoal, meals: meals.length, link }
      const summary = max !== null
        ? `Hoy: ${consumed} kcal comidas, ${burned} quemadas, máximo ${max} → ${remaining! >= 0 ? `te quedan ${remaining} kcal` : `exceso de ${-remaining!} kcal`}. Proteína ${Math.round(protein)}${proteinGoal ? `/${proteinGoal}` : ''} g.`
        : `Hoy: ${consumed} kcal comidas, ${burned} quemadas. Aún no hay peso para calcular el máximo.`

      return {
        content: [{ type: 'text' as const, text: `${summary}\nVer completo: ${link}\n<!--data:${JSON.stringify(data)}-->` }],
        structuredContent: data,
      }
    },
  )
}
