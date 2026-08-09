import type { SessionType, WeeklyPlanDay } from '../types'
import { formatDate } from '../utils/format'

const SESSION_LABEL: Record<SessionType, string> = {
  hvile: 'Hvile',
  rolig: 'Rolig',
  intervall: 'Intervall',
  terskel: 'Terskel',
  langtur: 'Langtur',
}

export function PlanDayDetailModal({ day, onClose }: { day: WeeklyPlanDay; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h2>
          {day.day} {formatDate(day.date)} — {SESSION_LABEL[day.session_type]}
        </h2>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>{day.title}</p>

        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="stat-tile">
            <span className="label">Distanse</span>
            <span className="value tabular">
              {day.target_distance_km > 0 ? `${day.target_distance_km} km` : '—'}
            </span>
          </div>
          <div className="stat-tile">
            <span className="label">Varighet</span>
            <span className="value tabular">
              {day.target_duration_min > 0 ? `${day.target_duration_min} min` : '—'}
            </span>
          </div>
        </div>

        <div className="hero-label" style={{ marginBottom: 4 }}>
          Innsats
        </div>
        <p style={{ marginBottom: 12, fontSize: 14 }}>{day.target_effort}</p>

        {day.expected_feeling && (
          <>
            <div className="hero-label" style={{ marginBottom: 4 }}>
              Forventet følelse
            </div>
            <p style={{ marginBottom: 12, fontSize: 14 }}>{day.expected_feeling}</p>
          </>
        )}

        {day.intervals && day.intervals.length > 0 && (
          <>
            <div className="hero-label" style={{ marginBottom: 8 }}>
              Øktoppsett
            </div>
            <div className="table-scroll" style={{ marginBottom: 16 }}>
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>Del</th>
                    <th>Lengde</th>
                    <th>Tempo</th>
                    <th>Puls</th>
                  </tr>
                </thead>
                <tbody>
                  {day.intervals.map((iv, i) => (
                    <tr key={i} style={{ cursor: 'default' }}>
                      <td>{iv.label}</td>
                      <td>{iv.duration_or_distance}</td>
                      <td className="tabular">{iv.target_pace}</td>
                      <td className="tabular">{iv.target_hr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="hero-label" style={{ marginBottom: 4 }}>
          Begrunnelse
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{day.rationale}</p>

        <div className="modal-actions">
          <button className="button-secondary" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
