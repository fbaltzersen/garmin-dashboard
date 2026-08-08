export const FEELINGS = ['bra', 'ok', 'slitent', 'smerte', 'motivert'] as const
export type Feeling = (typeof FEELINGS)[number]

export const FEELING_LABEL: Record<Feeling, string> = {
  bra: 'Bra',
  ok: 'Grei',
  slitent: 'Slitent',
  smerte: 'Smerte/vondt',
  motivert: 'Motivert',
}
