import { useState } from 'react'
import { ListOrdered } from 'lucide-react'
import type { ActivitySummary } from '../types'
import { Panel } from './Panel'
import { ActivityDetailModal } from './ActivityDetailModal'
import { formatDate, formatPaceMinPerKm } from '../utils/format'

export function ActivityTable({ activities }: { activities: ActivitySummary[] }) {
  const [selected, setSelected] = useState<ActivitySummary | null>(null)
  const recent = activities.slice(0, 15)

  return (
    <Panel title="Siste aktiviteter" icon={ListOrdered}>
      <div className="table-scroll">
        <table className="activity-table responsive-table">
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
                <td data-label="Dato">{formatDate(a.date)}</td>
                <td data-label="Navn">{a.name ?? a.type}</td>
                <td data-label="Distanse" className="tabular">
                  {a.distance_km.toFixed(2)} km
                </td>
                <td data-label="Tempo" className="tabular">
                  {formatPaceMinPerKm(a.distance_km, a.duration_min)}
                </td>
                <td data-label="Snittpuls" className="tabular">
                  {a.avg_hr ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recent.length === 0 && <p className="hero-note">Ingen aktiviteter registrert ennå.</p>}
      {selected && <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />}
    </Panel>
  )
}
