export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const to = (query.to as string) || new Date().toISOString().split('T')[0]
  const from = (query.from as string) || to

  const { data, error } = await admin
    .from('water_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', from)
    .lte('date', to)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al obtener registros de agua' })
  }

  const dailyTotals: Record<string, number> = {}
  for (const log of data || []) {
    dailyTotals[log.date] = (dailyTotals[log.date] || 0) + log.amount_ml
  }

  return { logs: data, dailyTotals }
})
