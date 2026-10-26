import type { H3Event } from 'h3'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createServer } from '../../mcp/src/server'

export async function serveMcp(event: H3Event, userId: string) {
  const server = createServer({
    db: useSupabaseAdmin() as any,
    userId: async () => userId,
    siteUrl: siteOrigin(event),
  })
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return transport.handleRequest(toWebRequest(event))
}
