import { setUserLocation } from '../../../mcp/src/location'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  if (!body?.country_code || !body?.timezone) {
    throw createError({ statusCode: 400, message: 'country_code y timezone son requeridos' })
  }

  try {
    return await setUserLocation(useSupabaseAdmin() as any, user.id, {
      countryCode: String(body.country_code),
      city: body.city ? String(body.city) : null,
      timezone: String(body.timezone),
    })
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
