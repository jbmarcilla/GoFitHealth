import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerWeightTools } from './tools/weight.js'
import { registerMealTools } from './tools/meals.js'
import { registerWaterTools } from './tools/water.js'
import { registerExerciseTools } from './tools/exercise.js'
import { registerStatusTools } from './tools/status.js'
import { registerGoalTools } from './tools/goals.js'
import { registerReportTools } from './tools/report.js'

export function createServer() {
  const server = new McpServer({
    name: 'gofit-health',
    version: '1.0.0',
  })

  registerWeightTools(server)
  registerMealTools(server)
  registerWaterTools(server)
  registerExerciseTools(server)
  registerStatusTools(server)
  registerGoalTools(server)
  registerReportTools(server)

  return server
}
