export function formatSecondsAsClock(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null) return '—'
  const sign = totalSeconds < 0 ? '-' : ''
  const s = Math.round(Math.abs(totalSeconds))
  const minutes = Math.floor(s / 60)
  const seconds = s % 60
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function formatDelta(deltaSeconds: number | null | undefined): string {
  if (deltaSeconds == null) return '—'
  const sign = deltaSeconds > 0 ? '+' : deltaSeconds < 0 ? '-' : ''
  return `${sign}${formatSecondsAsClock(Math.abs(deltaSeconds))}`
}

/** Rounds total seconds first, then splits into minutes/seconds - rounding
 * the seconds remainder on its own can round up to 60 (e.g. "5:60/km"
 * instead of rolling over to "6:00/km"). */
export function formatPaceFromMinutes(paceMin: number): string {
  const totalSeconds = Math.round(paceMin * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

export function formatPaceMinPerKm(distanceKm: number, durationMin: number): string {
  if (!distanceKm) return '—'
  return formatPaceFromMinutes(durationMin / distanceKm)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}
