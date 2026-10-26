import type { SupabaseClient } from '@supabase/supabase-js'

export interface ToolContext {
  db: SupabaseClient
  userId: () => Promise<string>
  siteUrl: string
}
