import type { LatestRollup } from '../types'
import { formatDate } from '../utils/format'

export function QuickStats({ latest }: { latest: LatestRollup }) {
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
        <span className="label">Sist synket</span>
        <span className="value">
          {latest.last_sync_utc ? new Date(latest.last_sync_utc).toLocaleString('nb-NO') : '—'}
        </span>
      </div>
    </div>
  )
}
