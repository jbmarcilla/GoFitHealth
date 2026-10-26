export const COUNTRY_TIMEZONES: Record<string, string[]> = {
  PE: ['America/Lima'],
  CL: ['America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter'],
  AR: ['America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Mendoza'],
  CO: ['America/Bogota'],
  MX: ['America/Mexico_City', 'America/Monterrey', 'America/Cancun', 'America/Tijuana', 'America/Hermosillo'],
  EC: ['America/Guayaquil', 'Pacific/Galapagos'],
  BO: ['America/La_Paz'],
  UY: ['America/Montevideo'],
  PY: ['America/Asuncion'],
  VE: ['America/Caracas'],
  BR: ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza'],
  CR: ['America/Costa_Rica'],
  PA: ['America/Panama'],
  DO: ['America/Santo_Domingo'],
  GT: ['America/Guatemala'],
  US: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix'],
  CA: ['America/Toronto', 'America/Vancouver'],
  ES: ['Europe/Madrid', 'Atlantic/Canary'],
  IT: ['Europe/Rome'],
  FR: ['Europe/Paris'],
  DE: ['Europe/Berlin'],
  GB: ['Europe/London'],
  PT: ['Europe/Lisbon'],
}

export function countryLabel(code: string): string {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function countryFlag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

export function timezoneLabel(tz: string): string {
  return tz.split('/').pop()!.replace(/_/g, ' ')
}
