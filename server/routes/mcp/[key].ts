import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from '../../../mcp/src/server'
import { resolveApiKey } from '../../../mcp/src/auth'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  const db = useSupabaseAdmin() as any
  const userId = key ? await resolveApiKey(db, key) : null
  if (!userId) {
    throw createError({ statusCode: 401, message: 'API key inválida' })
  }

  const server = createServer({
    db,
    userId: async () => userId,
    siteUrl: useRuntimeConfig().public.siteUrl as string,
  })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return transport.handleRequest(toWebRequest(event))
})
