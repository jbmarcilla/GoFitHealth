import { redeemLoginToken } from '../../mcp/src/magic'

/** Magic link from the chat: burns the one-time token and hands the browser a Supabase OTP to open a session. */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = typeof q.t === 'string' ? q.t : ''
  const next = typeof q.next === 'string' && q.next.startsWith('/') ? q.next : '/dashboard'
  const admin = useSupabaseAdmin()

  const userId = await redeemLoginToken(admin as any, token)
  if (!userId) return sendRedirect(event, `/login?expired=1&next=${encodeURIComponent(next)}`)

  const { data: userRes } = await admin.auth.admin.getUserById(userId)
  const email = userRes?.user?.email
  if (!email) return sendRedirect(event, '/login')

  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const tokenHash = data?.properties?.hashed_token
  if (error || !tokenHash) return sendRedirect(event, '/login')

  // Fragment keeps the OTP out of server logs and referrers.
  return sendRedirect(event, `/auth/magic#th=${encodeURIComponent(tokenHash)}&next=${encodeURIComponent(next)}`)
})
