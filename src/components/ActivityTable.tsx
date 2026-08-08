import { useState } from 'react'
import type { ActivitySummary } from '../types'
import { Panel } from './Panel'
import { ActivityDetailModal } from './ActivityDetailModal'
import { formatDate, formatPaceMinPerKm } from '../utils/format'

export function ActivityTable({ activities }: { activities: ActivitySummary[] }) {
  const [selected, setSelected] = useState<ActivitySummary | null>(null)
  const recent = activities.slice(0, 15)

  return (
    <Panel title="Siste aktiviteter">
      <table className="activity-table">
        <thead>
          <tr>
            <th>Dato</th>
            <th>Navn</th>
            <th>Distanse</th>
            <th>Tempo</th>
            <th>Snittpuls</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((a) => (
            <tr key={a.activity_id} onClick={() => setSelected(a)}>
              <td>{formatDate(a.date)}</td>
              <td>{a.name ?? a.type}</td>
              <td className="tabular">{a.distance_km.toFixed(2)} km</td>
              <td className="tabular">{formatPaceMinPerKm(a.distance_km, a.duration_min)}</td>
              <td className="tabular">{a.avg_hr ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {recent.length === 0 && <p className="hero-note">Ingen aktiviteter registrert ennå.</p>}
      {selected && <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />}
    </Panel>
  )
}
