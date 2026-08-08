import type { SessionType, TrainingPlan } from '../types'
import { Panel } from './Panel'
import { GeneratePlanButton } from './GeneratePlanButton'
import { formatDate, formatSecondsAsClock } from '../utils/format'

const SESSION_LABEL: Record<SessionType, string> = {
  hvile: 'Hvile',
  rolig: 'Rolig',
  intervall: 'Intervall',
  terskel: 'Terskel',
  langtur: 'Langtur',
}

const SESSION_COLOR: Record<SessionType, string> = {
  hvile: 'var(--status-neutral)',
  rolig: 'var(--seq-blue-350)',
  langtur: 'var(--series-blue)',
  terskel: 'var(--series-orange)',
  intervall: 'var(--status-critical)',
}

const CONFIDENCE_LABEL: Record<TrainingPlan['race_prediction']['confidence'], string> = {
  high: 'Høy sikkerhet',
  medium: 'Middels sikkerhet',
  low: 'Lav sikkerhet',
}

export function PlanPanel({ plan, onSuccess }: { plan: TrainingPlan | null; onSuccess: () => void }) {
  return (
    <Panel title="AI-treningsplan">
      <div className="app-header-actions" style={{ marginBottom: 16 }}>
        <GeneratePlanButton idleLabel={plan ? 'Generer ny plan' : 'Generer plan'} onSuccess={onSuccess} />
      </div>

      {!plan && <p className="hero-note">Ingen plan generert ennå. Trykk "Generer plan" for å komme i gang.</p>}

      {plan && (
        <>
          <div className="hero-label" style={{ marginBottom: 8 }}>
            {formatDate(plan.plan_start_date)} – {formatDate(plan.plan_end_date)} · generert{' '}
            {formatDate(plan.generated_at)}
          </div>

          <div className="table-scroll" style={{ marginBottom: 20 }}>
            <table className="activity-table plan-table">
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
                {plan.daily_plan.map((d) => (
                  <tr key={d.date} style={{ cursor: 'default' }} title={d.rationale}>
                    <td>
                      {d.day} <span className="tt-label">{formatDate(d.date)}</span>
                    </td>
                    <td>
                      <span
                        className="status-swatch"
                        style={{ background: SESSION_COLOR[d.session_type], display: 'inline-block', marginRight: 6 }}
                      />
                      {SESSION_LABEL[d.session_type]}
                    </td>
                    <td>{d.title}</td>
                    <td className="tabular">
                      {d.target_distance_km > 0 ? `${d.target_distance_km} km` : '—'}
                    </td>
                    <td>{d.target_effort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-grid" style={{ marginBottom: 16 }}>
            <div>
              <div className="hero-label">VO2max-prognose</div>
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
            <div>
              <div className="hero-label">5K-prediksjon (AI-vurdert)</div>
              <div className="hero-row" style={{ marginBottom: 4 }}>
                <div className="hero-figure tabular" style={{ fontSize: 32 }}>
                  {formatSecondsAsClock(plan.race_prediction.current_5k_seconds)}
                </div>
                <div className="hero-label">
                  {CONFIDENCE_LABEL[plan.race_prediction.confidence]}
                  {plan.race_prediction.estimated_weeks_to_goal > 0 &&
                    ` · ~${plan.race_prediction.estimated_weeks_to_goal} uker til målet`}
                </div>
              </div>
              <p className="hero-note">{plan.race_prediction.reasoning}</p>
            </div>
          </div>

          <div className="hero-label">Coaching-notater</div>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{plan.coaching_notes}</p>
        </>
      )}
    </Panel>
  )
}
