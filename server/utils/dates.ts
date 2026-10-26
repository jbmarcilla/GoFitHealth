export function localDate(timezone: string, offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(d)
  } catch {
    return d.toISOString().split('T')[0]
  }
}

export async function userToday(userId: string): Promise<string> {
  const { data } = await useSupabaseAdmin().from('profiles').select('timezone').eq('id', userId).maybeSingle()
  return localDate((data?.timezone as string) || 'America/Lima')
}
