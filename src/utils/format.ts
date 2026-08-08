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

export function formatPaceMinPerKm(distanceKm: number, durationMin: number): string {
  if (!distanceKm) return '—'
  const paceMin = durationMin / distanceKm
  const minutes = Math.floor(paceMin)
  const seconds = Math.round((paceMin - minutes) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}
