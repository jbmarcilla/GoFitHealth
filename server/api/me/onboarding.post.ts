export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { error } = await (useSupabaseAdmin() as any)
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) throw createError({ statusCode: 500, message: 'No se pudo guardar el onboarding' })
  return { ok: true }
})
