import type { ActivitySummary, AdherenceEntry, AdherenceStatus, SessionType, TrainingPlan } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'
import { computeDayStatus } from '../utils/adherence'

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

function todayIsoLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The backend list only updates when a plan is (re)generated, so a run
 * logged since the last generation wouldn't show up until the next one -
 * typically tomorrow's daily cron. Fill that gap by computing today's own
 * status live from the current plan, using the same rules as the backend.
 * This is reliable as long as today's plan entry hasn't itself been
 * rewritten by a same-day regeneration after training already happened -
 * the normal case (one generation per morning, before that day's run). */
function liveTodayEntry(plan: TrainingPlan | null, activities: ActivitySummary[]): AdherenceEntry | null {
  const todayIso = todayIsoLocal()
  const today = plan?.daily_plan.find((d) => d.date === todayIso)
  if (!today) return null
  const todayActivities = activities.filter((a) => a.date === todayIso)
  const actualKm = todayActivities.filter((a) => a.counts_as_running).reduce((sum, a) => sum + (a.distance_km || 0), 0)
  const status = computeDayStatus(today, todayActivities, false)
  if (status === 'upcoming') return null
  return {
    date: todayIso,
    planned_type: today.session_type,
    planned_title: today.title,
    planned_distance_km: today.target_distance_km,
    actual_distance_km: Math.round(actualKm * 100) / 100,
    status,
  }
}

export function AdherencePanel({
  entries,
  plan,
  activities,
}: {
  entries: AdherenceEntry[]
  plan: TrainingPlan | null
  activities: ActivitySummary[]
}) {
  const hasToday = entries.some((e) => e.date === todayIsoLocal())
  const live = hasToday ? null : liveTodayEntry(plan, activities)
  const allEntries = live ? [...entries, live] : entries

  if (allEntries.length === 0) {
    return (
      <Panel title="Planetterlevelse (siste 14 dager)">
        <p className="hero-note">
          Ingen data ennå — dette fylles opp etter hvert som planlagte dager passerer og kan
          sammenlignes mot faktiske økter.
        </p>
      </Panel>
    )
  }

  const counts = allEntries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] ?? 0) + 1
      return acc
    },
    {} as Record<AdherenceStatus, number>,
  )

  return (
    <Panel title="Planetterlevelse (siste 14 dager)">
      <p className="hero-note" style={{ marginBottom: 12 }}>
        Sammenligner det som faktisk ble foreskrevet *før* hver dag inntraff mot hva som ble
        gjennomført — ikke det planen sier i dag (som allerede kan være justert i etterkant).
        Sendes til AI-en ved neste planlegging. Historikken oppdateres når en ny plan genereres
        (daglig kl. 06 UTC, eller ved manuell "Generer ny plan"); dagens rad er beregnet live og
        oppdateres med en gang du synker en ny økt.
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
            {[...allEntries].reverse().map((e) => (
              <tr key={e.date} style={{ cursor: 'default' }}>
                <td>
                  {formatDate(e.date)}
                  {e === live && <span className="tt-label"> (live)</span>}
                </td>
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
