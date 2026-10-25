export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const to = (query.to as string) || new Date().toISOString().split('T')[0]
  const from = (query.from as string) || (() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })()

  const { data, error } = await admin
    .from('weight_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al obtener registros de peso' })
  }

  return data
})
