export interface HrZone {
  zone: 1 | 2 | 3 | 4 | 5
  label: string
  lowerBpm: number
  upperBpm: number | null
}

// Friel-style running zones relative to lactate-threshold heart rate (LTHR) -
// a standard, widely used model (TrainingPeaks et al.) for deriving personal
// HR zones from a single threshold number rather than age-based guesses.
const ZONE_BOUNDS: { zone: HrZone['zone']; label: string; lowerPct: number; upperPct: number | null }[] = [
  { zone: 1, label: 'Restitusjon', lowerPct: 0, upperPct: 0.85 },
  { zone: 2, label: 'Aerob / rolig', lowerPct: 0.85, upperPct: 0.89 },
  { zone: 3, label: 'Tempo', lowerPct: 0.9, upperPct: 0.94 },
  { zone: 4, label: 'Terskel', lowerPct: 0.95, upperPct: 0.99 },
  { zone: 5, label: 'Anaerob', lowerPct: 1.0, upperPct: null },
]

export function computeHrZones(lthrBpm: number): HrZone[] {
  return ZONE_BOUNDS.map((z) => ({
    zone: z.zone,
    label: z.label,
    lowerBpm: Math.round(lthrBpm * z.lowerPct),
    upperBpm: z.upperPct != null ? Math.round(lthrBpm * z.upperPct) : null,
  }))
}
