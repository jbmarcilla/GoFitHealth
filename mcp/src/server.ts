import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ToolContext } from './context.js'
import { registerWeightTools } from './tools/weight.js'
import { registerMealTools } from './tools/meals.js'
import { registerWaterTools } from './tools/water.js'
import { registerExerciseTools } from './tools/exercise.js'
import { registerStatusTools } from './tools/status.js'
import { registerGoalTools } from './tools/goals.js'
import { registerReportTools } from './tools/report.js'
import { registerEntryTools } from './tools/entries.js'
import { registerLocationTools } from './tools/location.js'
import { SERVER_INSTRUCTIONS } from './coach.js'

export function createServer(ctx: ToolContext) {
  const server = new McpServer(
    { name: 'gofit-health', version: '1.0.0' },
    { instructions: SERVER_INSTRUCTIONS },
  )

  registerWeightTools(server, ctx)
  registerMealTools(server, ctx)
  registerWaterTools(server, ctx)
  registerExerciseTools(server, ctx)
  registerStatusTools(server, ctx)
  registerGoalTools(server, ctx)
  registerReportTools(server, ctx)
  registerEntryTools(server, ctx)
  registerLocationTools(server, ctx)

  return server
}
