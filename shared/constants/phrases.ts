export const BODY_PHRASES = [
  'Tu cuerpo ya es hermoso. Esto es para sentirte mejor en él.',
  'No vienes a arreglarte. Vienes a cuidarte.',
  'Eres más que un número en la balanza.',
  'Progreso, no perfección. Un poco mejor que ayer basta.',
  'Tu cuerpo te lleva a todos lados. Hoy, trátalo con cariño.',
  'Ningún alimento es malo. Ningún día está perdido.',
  'Moverte es celebrar lo que tu cuerpo puede hacer.',
  'Cada vaso de agua es un gesto de amor contigo.',
  'Descansar también es entrenar.',
  'Hoy no tienes que ser perfecto. Solo estar presente.',
]

export function randomPhrase(): string {
  return BODY_PHRASES[Math.floor(Math.random() * BODY_PHRASES.length)]
}

export function phraseOfTheDay(date = new Date()): string {
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86_400_000)
  return BODY_PHRASES[day % BODY_PHRASES.length]
}
