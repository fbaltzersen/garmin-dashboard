import { useState } from 'react'
import { CalendarDays, Gauge, NotebookPen } from 'lucide-react'
import type { TrainingPlan, WeeklyPlanDay } from '../types'
import { Panel } from './Panel'
import { GeneratePlanButton } from './GeneratePlanButton'
import { PlanDayDetailModal } from './PlanDayDetailModal'
import { formatDate } from '../utils/format'
import { SESSION_COLOR, SESSION_ICON, SESSION_LABEL } from '../uiMeta'

export function PlanPanel({ plan, onSuccess }: { plan: TrainingPlan | null; onSuccess: () => void }) {
  const [selectedDay, setSelectedDay] = useState<WeeklyPlanDay | null>(null)

  return (
    <Panel title="AI-treningsplan" icon={CalendarDays}>
      <div className="app-header-actions" style={{ marginBottom: 16 }}>
        <GeneratePlanButton idleLabel={plan ? 'Generer ny plan' : 'Generer plan'} onSuccess={onSuccess} />
      </div>

      {!plan && <p className="hero-note">Ingen plan generert ennå. Trykk "Generer plan" for å komme i gang.</p>}

      {plan && (
        <>
          <div className="hero-label" style={{ marginBottom: 4 }}>
            {formatDate(plan.plan_start_date)} – {formatDate(plan.plan_end_date)} · generert{' '}
            {formatDate(plan.generated_at)}
          </div>
          <p className="hero-note" style={{ marginBottom: 8 }}>
            Trykk på en økt for detaljer (øktoppsett, forventet følelse). AI-ens 5K-vurdering og
            utvikling over tid vises i Progresjon-fanen.
          </p>

          <div className="table-scroll" style={{ marginBottom: 20 }}>
            <table className="activity-table plan-table responsive-table">
              <thead>
                <tr>
                  <th>Dag</th>
                  <th>Type</th>
                  <th>Økt</th>
                  <th>Distanse</th>
                  <th>Innsats</th>
                </tr>
              </thead>
              <tbody>
                {plan.daily_plan.map((d) => {
                  const SessionIcon = SESSION_ICON[d.session_type]
                  return (
                    <tr key={d.date} onClick={() => setSelectedDay(d)}>
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
                      <td data-label="Distanse" className="tabular">
                        {d.target_distance_km > 0 ? `${d.target_distance_km} km` : '—'}
                      </td>
                      <td data-label="Innsats">{d.target_effort}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Gauge style={{ width: 14, height: 14, color: 'var(--series-aqua)' }} />
              VO2max-prognose
            </div>
            <div className="stat-row">
              <div className="stat-tile">
                <span className="label">Nå</span>
                <span className="value tabular">{plan.vo2max_projection.current}</span>
              </div>
              <div className="stat-tile">
                <span className="label">Om 4 uker</span>
                <span className="value tabular">{plan.vo2max_projection.in_4_weeks}</span>
              </div>
              <div className="stat-tile">
                <span className="label">Om 12 uker</span>
                <span className="value tabular">{plan.vo2max_projection.in_12_weeks}</span>
              </div>
            </div>
            <p className="hero-note">{plan.vo2max_projection.reasoning}</p>
          </div>

          <div className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <NotebookPen style={{ width: 14, height: 14, color: 'var(--series-blue)' }} />
            Coaching-notater
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{plan.coaching_notes}</p>
        </>
      )}
      {selectedDay && <PlanDayDetailModal day={selectedDay} onClose={() => setSelectedDay(null)} />}
    </Panel>
  )
}
