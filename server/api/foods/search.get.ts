export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const admin = useSupabaseAdmin()

  const q = (query.q as string || '').trim()
  const limit = Math.min(Number(query.limit) || 20, 50)

  if (!q) {
    throw createError({ statusCode: 400, message: 'Parámetro de búsqueda "q" es requerido' })
  }

  const { data, error } = await admin
    .from('foods')
    .select('*')
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
    .limit(limit)
    .order('verified', { ascending: false })
    .order('name')

  if (error) {
    throw createError({ statusCode: 500, message: 'Error al buscar alimentos' })
  }

  return data
})
