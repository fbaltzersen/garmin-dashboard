import { CalendarRange } from 'lucide-react'
import type { ActivitySummary, TrainingPlan } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'
import { computeDayStatus } from '../utils/adherence'
import { SESSION_COLOR, SESSION_ICON, SESSION_LABEL, STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from '../uiMeta'

function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // Monday = 0 .. Sunday = 6
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toIsoDate(d: Date): string {
  // NOT toISOString() - that converts to UTC first, which rolls the date
  // back a day for any timezone ahead of UTC (e.g. local midnight CEST is
  // still "yesterday" in UTC). Format the local calendar date directly.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function WeekSummaryPanel({
  plan,
  activities,
}: {
  plan: TrainingPlan | null
  activities: ActivitySummary[]
}) {
  const today = new Date()
  const monday = mondayOf(today)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekStart = toIsoDate(monday)
  const weekEnd = toIsoDate(sunday)
  const todayIso = toIsoDate(today)

  const weekDays = (plan?.daily_plan ?? []).filter((d) => d.date >= weekStart && d.date <= weekEnd)

  const activitiesByDate = new Map<string, ActivitySummary[]>()
  const runningKmByDate = new Map<string, number>()
  for (const a of activities) {
    if (a.date < weekStart || a.date > weekEnd) continue
    activitiesByDate.set(a.date, [...(activitiesByDate.get(a.date) ?? []), a])
    if (a.counts_as_running) {
      runningKmByDate.set(a.date, (runningKmByDate.get(a.date) ?? 0) + (a.distance_km || 0))
    }
  }

  const dueSoFar = weekDays.filter((d) => d.date <= todayIso)
  const completedSoFar = dueSoFar.filter(
    (d) => computeDayStatus(d, activitiesByDate.get(d.date) ?? [], d.date > todayIso) === 'completed',
  ).length
  const completionPct = dueSoFar.length > 0 ? Math.round((completedSoFar / dueSoFar.length) * 100) : 0
  const runningKmThisWeek = [...runningKmByDate.values()].reduce((a, b) => a + b, 0)

  return (
    <Panel title={`Denne uken (${formatDate(weekStart)} – ${formatDate(weekEnd)})`} icon={CalendarRange}>
      {!plan && <p className="hero-note">Ingen plan generert ennå — gå til "Planlegging" for å komme i gang.</p>}
      {plan && weekDays.length === 0 && (
        <p className="hero-note">Planen dekker ikke inneværende uke ennå. Generer en ny plan for å fylle den ut.</p>
      )}
      {weekDays.length > 0 && (
        <>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <div className="stat-tile">
              <span className="label">Løpt denne uken (inkl. mølle)</span>
              <span className="value tabular">{runningKmThisWeek.toFixed(1)} km</span>
            </div>
            <div className="stat-tile">
              <span className="label">Gjennomført så langt</span>
              <span className="value tabular">
                {completedSoFar}/{dueSoFar.length}
              </span>
              <div className="progress-bar" style={{ marginTop: 4 }}>
                <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>
          <div className="table-scroll">
            <table className="activity-table responsive-table">
              <thead>
                <tr>
                  <th>Dag</th>
                  <th>Type</th>
                  <th>Økt</th>
                  <th>Distanse (plan / faktisk)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((d) => {
                  const status = computeDayStatus(d, activitiesByDate.get(d.date) ?? [], d.date > todayIso)
                  const actualKm = runningKmByDate.get(d.date) ?? 0
                  const SessionIcon = SESSION_ICON[d.session_type]
                  const StatusIcon = STATUS_ICON[status]
                  return (
                    <tr key={d.date} style={{ cursor: 'default' }}>
                      <td data-label="Dag">
                        {d.day} <span className="tt-label">{formatDate(d.date)}</span>
                      </td>
                      <td data-label="Type">
                        <span className="badge" style={{ color: SESSION_COLOR[d.session_type] }}>
                          <SessionIcon />
                          {SESSION_LABEL[d.session_type]}
                        </span>
                      </td>
                      <td data-label="Økt">{d.title}</td>
                      <td data-label="Distanse (plan / faktisk)" className="tabular">
                        {d.target_distance_km > 0 ? `${d.target_distance_km} km` : '—'} /{' '}
                        {actualKm > 0 ? `${actualKm.toFixed(1)} km` : '—'}
                      </td>
                      <td data-label="Status">
                        <span className="badge" style={{ color: STATUS_COLOR[status] }}>
                          <StatusIcon />
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  )
}
