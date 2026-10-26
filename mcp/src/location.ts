import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserLocation {
  id: string
  city: string | null
  timezone: string
  is_current: boolean
  started_at: string
  ended_at: string | null
  country: { code: string; name: string }
}

const LOCATION_SELECT = 'id, city, timezone, is_current, started_at, ended_at, country:countries(code, name)'

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function countryFlag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export async function ensureCountry(db: SupabaseClient, code: string): Promise<string> {
  const upper = code.toUpperCase()
  const { data: existing } = await db.from('countries').select('id').eq('code', upper).maybeSingle()
  if (existing) return existing.id

  const { data, error } = await db
    .from('countries')
    .upsert({ code: upper, name: countryName(upper) }, { onConflict: 'code' })
    .select('id')
    .single()
  if (error || !data) throw new Error(`No se pudo registrar el país ${upper}: ${error?.message}`)
  return data.id
}

export async function getLocations(db: SupabaseClient, userId: string, limit = 20): Promise<UserLocation[]> {
  const { data } = await db
    .from('user_locations')
    .select(LOCATION_SELECT)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as UserLocation[]
}

export async function getCurrentLocation(db: SupabaseClient, userId: string): Promise<UserLocation | null> {
  const { data } = await db
    .from('user_locations')
    .select(LOCATION_SELECT)
    .eq('user_id', userId)
    .eq('is_current', true)
    .maybeSingle()
  return (data as unknown as UserLocation) ?? null
}

export async function setUserLocation(
  db: SupabaseClient,
  userId: string,
  input: { countryCode: string; city?: string | null; timezone: string },
): Promise<{ location: UserLocation; changed: boolean }> {
  const code = input.countryCode.toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) throw new Error('country_code debe ser un código ISO de 2 letras (ej. PE, CL)')
  if (!isValidTimezone(input.timezone)) throw new Error(`Zona horaria inválida: ${input.timezone}`)

  const city = input.city?.trim() || null
  const current = await getCurrentLocation(db, userId)
  if (
    current
    && current.country.code === code
    && (current.city ?? '').toLowerCase() === (city ?? '').toLowerCase()
    && current.timezone === input.timezone
  ) {
    return { location: current, changed: false }
  }

  const countryId = await ensureCountry(db, code)

  if (current) {
    await db
      .from('user_locations')
      .update({ is_current: false, ended_at: new Date().toISOString() })
      .eq('id', current.id)
  }

  const { data, error } = await db
    .from('user_locations')
    .insert({ user_id: userId, country_id: countryId, city, timezone: input.timezone, is_current: true })
    .select(LOCATION_SELECT)
    .single()
  if (error || !data) throw new Error(`No se pudo guardar la ubicación: ${error?.message}`)

  await db.from('profiles').update({ timezone: input.timezone }).eq('id', userId)

  return { location: data as unknown as UserLocation, changed: true }
}

export function formatLocation(loc: UserLocation): string {
  return `${countryFlag(loc.country.code)} ${loc.city ? `${loc.city}, ` : ''}${loc.country.name}`
}
