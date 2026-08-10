import { Activity } from 'lucide-react'
import type { TrainingStatusPoint } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

const STATUS_COLOR: Record<string, string> = {
  NO_STATUS: 'var(--status-neutral)',
  PAUSED: 'var(--status-neutral)',
  DETRAINING: 'var(--seq-blue-250)',
  RECOVERY: 'var(--seq-blue-350)',
  MAINTAINING: 'var(--seq-blue-450)',
  PRODUCTIVE: 'var(--status-good)',
  PEAKING: 'var(--series-violet)',
  OVERREACHING: 'var(--status-warning)',
  OVERTRAINING: 'var(--status-critical)',
}

const STATUS_LABEL_NO: Record<string, string> = {
  NO_STATUS: 'Ingen status',
  PAUSED: 'Pause',
  DETRAINING: 'Detrening',
  RECOVERY: 'Restitusjon',
  MAINTAINING: 'Vedlikehold',
  PRODUCTIVE: 'Produktiv',
  PEAKING: 'Peak',
  OVERREACHING: 'Overreaching',
  OVERTRAINING: 'Overtrening',
}

function colorFor(status: string): string {
  return STATUS_COLOR[status] ?? 'var(--status-neutral)'
}

export function TrainingStatusStrip({ data }: { data: TrainingStatusPoint[] }) {
  if (data.length === 0) {
    return (
      <Panel title="Treningsstatus" icon={Activity}>
        <p className="hero-note">Ingen treningsstatus registrert ennå.</p>
      </Panel>
    )
  }

  const present = Array.from(new Set(data.map((d) => d.status)))
  const first = data[0].date
  const last = data[data.length - 1].date

  return (
    <Panel title="Treningsstatus" icon={Activity}>
      <div className="status-strip">
        {data.map((d) => (
          <div
            key={d.date}
            className="status-strip-segment"
            style={{ background: colorFor(d.status) }}
            title={`${formatDate(d.date)}: ${STATUS_LABEL_NO[d.status] ?? d.status}`}
          />
        ))}
      </div>
      <div className="hero-note" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{formatDate(first)}</span>
        <span>{formatDate(last)}</span>
      </div>
      <div className="status-legend">
        {present.map((status) => (
          <div className="status-legend-item" key={status}>
            <span className="status-swatch" style={{ background: colorFor(status) }} />
            {STATUS_LABEL_NO[status] ?? status}
          </div>
        ))}
      </div>
    </Panel>
  )
}
