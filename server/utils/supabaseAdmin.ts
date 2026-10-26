import { createClient } from '@supabase/supabase-js'

export function useSupabaseAdmin() {
  const config = useRuntimeConfig()
  const url = (config.public as any).supabase?.url || process.env.SUPABASE_URL || ''
  const key = (config as any).supabase?.serviceKey || config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!url || !key) {
    throw createError({ statusCode: 500, message: 'Supabase URL o Service Role Key no configurada' })
  }

  return createClient(url, key, { auth: { persistSession: false } })
}
