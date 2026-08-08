import type { AdherenceEntry, AdherenceStatus, SessionType } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

const STATUS_LABEL: Record<AdherenceStatus, string> = {
  completed: 'Gjennomført',
  partial: 'Delvis',
  missed: 'Droppet',
  rest_broken: 'Trente på hviledag',
}

const STATUS_COLOR: Record<AdherenceStatus, string> = {
  completed: 'var(--status-good)',
  partial: 'var(--status-warning)',
  missed: 'var(--status-critical)',
  rest_broken: 'var(--status-warning)',
}

const SESSION_LABEL: Record<SessionType, string> = {
  hvile: 'Hvile',
  rolig: 'Rolig',
  intervall: 'Intervall',
  terskel: 'Terskel',
  langtur: 'Langtur',
}

export function AdherencePanel({ entries }: { entries: AdherenceEntry[] }) {
  if (entries.length === 0) {
    return (
      <Panel title="Planetterlevelse (siste 14 dager)">
        <p className="hero-note">
          Ingen data ennå — dette fylles opp etter hvert som planlagte dager passerer og kan
          sammenlignes mot faktiske økter.
        </p>
      </Panel>
    )
  }

  const counts = entries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1
      return acc
    },
    {} as Record<AdherenceStatus, number>,
  )

  return (
    <Panel title="Planetterlevelse (siste 14 dager)">
      <p className="hero-note" style={{ marginBottom: 12 }}>
        Sammenligner det siste genererte planen sa for hver dag med hva som faktisk ble
        gjennomført. Sendes til AI-en ved neste planlegging slik at den ser om forrige plan
        faktisk ble fulgt, ikke bare hva som var foreskrevet.
      </p>
      <div className="stat-row" style={{ marginBottom: 16 }}>
        {(Object.keys(STATUS_LABEL) as AdherenceStatus[]).map((status) => (
          <div className="stat-tile" key={status}>
            <span className="label">{STATUS_LABEL[status]}</span>
            <span className="value tabular" style={{ color: STATUS_COLOR[status] }}>
              {counts[status] ?? 0}
            </span>
          </div>
        ))}
      </div>
      <div className="table-scroll">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Dato</th>
              <th>Planlagt</th>
              <th>Distanse (plan / faktisk)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((e) => (
              <tr key={e.date} style={{ cursor: 'default' }}>
                <td>{formatDate(e.date)}</td>
                <td>
                  {SESSION_LABEL[e.planned_type]}
                  {e.planned_title ? ` — ${e.planned_title}` : ''}
                </td>
                <td className="tabular">
                  {e.planned_distance_km > 0 ? `${e.planned_distance_km} km` : '—'} /{' '}
                  {e.actual_distance_km > 0 ? `${e.actual_distance_km} km` : '—'}
                </td>
                <td style={{ color: STATUS_COLOR[e.status] }}>{STATUS_LABEL[e.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
