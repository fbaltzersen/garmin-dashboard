import type { AcwrRiskBand, LatestRollup } from '../types'
import { formatDate } from '../utils/format'

const ACWR_LABEL: Record<AcwrRiskBand, string> = {
  low: 'Lav belastning',
  optimal: 'Optimal sone',
  elevated: 'Forhøyet risiko',
  high: 'Høy risiko',
  insufficient_data: 'For lite data',
}

const ACWR_COLOR: Record<AcwrRiskBand, string> = {
  low: 'var(--status-neutral)',
  optimal: 'var(--status-good)',
  elevated: 'var(--status-warning)',
  high: 'var(--status-critical)',
  insufficient_data: 'var(--status-neutral)',
}

export function QuickStats({ latest }: { latest: LatestRollup }) {
  const acwr = latest.acwr
  return (
    <div className="stat-row">
      <div className="stat-tile">
        <span className="label">Ukentlig volum (utendørs)</span>
        <span className="value tabular">
          {latest.weekly_volume_km_last_7d != null ? `${latest.weekly_volume_km_last_7d} km` : '—'}
        </span>
      </div>
      <div className="stat-tile">
        <span className="label">Siste aktivitet</span>
        <span className="value">{formatDate(latest.last_activity_date)}</span>
      </div>
      <div className="stat-tile">
        <span className="label">Laktatterskel</span>
        <span className="value tabular">
          {latest.lactate_threshold?.heart_rate ? `${latest.lactate_threshold.heart_rate} bpm` : '—'}
        </span>
      </div>
      <div className="stat-tile">
        <span className="label">Belastning (7d/28d-snitt)</span>
        <span className="value tabular" style={{ color: acwr ? ACWR_COLOR[acwr.risk_band] : undefined }}>
          {acwr?.value != null ? acwr.value.toFixed(2) : '—'}
        </span>
        <span className="label">{acwr ? ACWR_LABEL[acwr.risk_band] : '—'}</span>
      </div>
      <div className="stat-tile">
        <span className="label">Sist synket</span>
        <span className="value">
          {latest.last_sync_utc ? new Date(latest.last_sync_utc).toLocaleString('nb-NO') : '—'}
        </span>
      </div>
    </div>
  )
}
