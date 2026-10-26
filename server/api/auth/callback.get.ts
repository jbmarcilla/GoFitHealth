import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    return sendRedirect(event, '/?error=no_code')
  }

  const client = await serverSupabaseClient(event)
  const { error } = await client.auth.exchangeCodeForSession(code)

  if (error) {
    return sendRedirect(event, `/?error=${error.message}`)
  }

  const next = getCookie(event, 'gofit_next')
  deleteCookie(event, 'gofit_next', { path: '/' })
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  return sendRedirect(event, safeNext)
})
