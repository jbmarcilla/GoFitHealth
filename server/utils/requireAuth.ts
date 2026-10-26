import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export async function requireAuth(event: H3Event) {
  const claims = await serverSupabaseUser(event)
  // @nuxtjs/supabase v2 returns JWT claims: the user id lives in `sub`
  const id = (claims as any)?.sub ?? (claims as any)?.id
  if (!claims || !id) {
    throw createError({ statusCode: 401, message: 'No autenticado' })
  }
  return { ...claims, id: id as string }
}
