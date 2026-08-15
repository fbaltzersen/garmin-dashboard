import { useState } from 'react'
import { ListOrdered } from 'lucide-react'
import type { ActivitySummary } from '../types'
import { Panel } from './Panel'
import { ListGroup, ListRow } from './ListRow'
import { ActivityDetailModal } from './ActivityDetailModal'
import { formatDate, formatPaceMinPerKm } from '../utils/format'
import { SESSION_COLOR } from '../uiMeta'

export function ActivityTable({ activities }: { activities: ActivitySummary[] }) {
  const [selected, setSelected] = useState<ActivitySummary | null>(null)
  const recent = activities.slice(0, 30)

  return (
    <Panel title="Siste økter" icon={ListOrdered}>
      {recent.length === 0 && <p className="hero-note">Ingen aktiviteter registrert ennå.</p>}
      {recent.length > 0 && (
        <ListGroup>
          {recent.map((a) => (
            <ListRow
              key={a.activity_id}
              color={a.classified_session_type ? SESSION_COLOR[a.classified_session_type] : 'var(--status-neutral)'}
              title={a.name ?? a.type ?? 'Aktivitet'}
              subtitle={`${formatDate(a.date)} · ${a.distance_km.toFixed(1)} km · ${formatPaceMinPerKm(a.distance_km, a.duration_min)}`}
              value={`${Math.round(a.duration_min)} min`}
              onClick={() => setSelected(a)}
            />
          ))}
        </ListGroup>
      )}
      {selected && <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />}
    </Panel>
  )
}
