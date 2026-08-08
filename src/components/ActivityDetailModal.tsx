import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchActivityDetail } from '../api/github'
import type { ActivityDetail, ActivitySummary } from '../types'

export function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: ActivitySummary
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivityDetail<ActivityDetail>(activity.date, activity.activity_id)
      .then(setDetail)
      .catch((err) => setError(err.message))
  }, [activity])

  const laps = detail?.splits?.lapDTOs ?? []
  const laneData = laps.map((lap, i) => ({
    lap: i + 1,
    paceMinPerKm: lap.distance ? lap.duration / 60 / (lap.distance / 1000) : null,
    avgHR: lap.averageHR,
  }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <h2>{activity.name ?? 'Aktivitet'}</h2>
        <p>
          {activity.distance_km} km · {activity.duration_min.toFixed(0)} min
          {activity.avg_hr ? ` · ${activity.avg_hr} bpm snitt` : ''}
        </p>
        {error && <p className="sync-status error">{error}</p>}
        {!detail && !error && <p className="hero-note">Laster splits…</p>}
        {laneData.length > 0 && (
          <>
            <div className="hero-label" style={{ marginTop: 16 }}>
              Tempo per lap (min/km)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={laneData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="lap" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(2)} min/km`, 'Tempo']}
                  contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                  cursor={{ fill: 'var(--gridline)' }}
                />
                <Bar dataKey="paceMinPerKm" fill="var(--series-blue)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {detail && laneData.length === 0 && (
          <p className="hero-note">Ingen lap-data registrert for denne aktiviteten.</p>
        )}
        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="button-secondary" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  )
}
