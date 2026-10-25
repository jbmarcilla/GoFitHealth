export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const date = query.date as string | undefined
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  let q = admin
    .from('exercise_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (date) {
    q = q.eq('date', date)
  } else if (from && to) {
    q = q.gte('date', from).lte('date', to)
  } else {
    q = q.eq('date', new Date().toISOString().split('T')[0])
  }

  const { data, error } = await q

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al obtener ejercicios' })
  }

  return data
})
