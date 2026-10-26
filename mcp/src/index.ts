import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'
import { supabase } from './db.js'
import { resolveApiKey } from './auth.js'

let userId: string | null = null

const server = createServer({
  db: supabase,
  siteUrl: process.env.GOFIT_SITE_URL ?? 'https://gofit.health',
  userId: async () => {
    if (userId) return userId
    const apiKey = process.env.GOFIT_API_KEY
    if (!apiKey) throw new Error('GOFIT_API_KEY is required')
    userId = await resolveApiKey(supabase, apiKey)
    if (!userId) throw new Error('Invalid GOFIT_API_KEY')
    return userId
  },
})

await server.connect(new StdioServerTransport())
