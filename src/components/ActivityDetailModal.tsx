import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Footprints, Mountain } from 'lucide-react'
import { fetchActivityDetail } from '../api/github'
import { fetchJournalEntryForActivity, upsertJournalEntry } from '../api/journal'
import { FEELINGS, FEELING_LABEL, type Feeling } from '../journalOptions'
import type { ActivityDetail, ActivityLap, ActivitySummary } from '../types'
import { SESSION_COLOR, SESSION_ICON, SESSION_LABEL } from '../uiMeta'
import { formatPaceMinPerKm } from '../utils/format'

interface LapPoint {
  lap: number
  paceMinPerKm: number | null
  avgHR: number | null
  elevationGain: number | null
  intensityType: string | null
}

/** Mirrors aggregate.py's _active_laps_summary - for structured sessions,
 * the whole-activity average is dragged toward something much easier than
 * what was actually run by the walk/jog recovery between reps. Using only
 * the ACTIVE-tagged laps gives the honest "how fast were the reps" number. */
function activeLapsSummary(laps: ActivityLap[]): { paceMinPerKm: number; avgHr: number | null } | null {
  const active = laps.filter((l) => l.intensityType === 'ACTIVE')
  const totalDistanceM = active.reduce((sum, l) => sum + (l.distance || 0), 0)
  const totalDurationS = active.reduce((sum, l) => sum + (l.duration || 0), 0)
  if (totalDistanceM <= 0 || totalDurationS <= 0) return null
  const distanceKm = totalDistanceM / 1000
  const durationMin = totalDurationS / 60
  const hrWeighted = active.filter((l) => l.averageHR).map((l) => [l.averageHR as number, l.duration || 0])
  const hrDurationTotal = hrWeighted.reduce((sum, [, d]) => sum + d, 0)
  const avgHr = hrDurationTotal > 0 ? Math.round(hrWeighted.reduce((sum, [hr, d]) => sum + hr * d, 0) / hrDurationTotal) : null
  return { paceMinPerKm: durationMin / distanceKm, avgHr }
}

function IntensityDot({ cx, cy, payload }: any) {
  const isActive = payload?.intensityType === 'ACTIVE'
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isActive ? 4.5 : 3}
      fill={isActive ? 'var(--status-critical)' : 'var(--series-blue)'}
      stroke="var(--surface-1)"
      strokeWidth={1.5}
    />
  )
}

function PaceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: LapPoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">Lap {label}</div>
      <div>{p.paceMinPerKm != null ? `${p.paceMinPerKm.toFixed(2)} min/km` : '—'}</div>
      {p.intensityType && <div className="tt-label">{p.intensityType}</div>}
    </div>
  )
}

function HrTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: LapPoint = payload[0].payload
  if (p.avgHR == null) return null
  return (
    <div className="tooltip-box">
      <div className="tt-label">Lap {label}</div>
      <div>{p.avgHR} bpm</div>
      {p.intensityType && <div className="tt-label">{p.intensityType}</div>}
    </div>
  )
}

export function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: ActivitySummary
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rpe, setRpe] = useState(5)
  const [feeling, setFeeling] = useState<Feeling>('ok')
  const [note, setNote] = useState('')
  const [journalStatus, setJournalStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>(
    'loading',
  )
  const [journalError, setJournalError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivityDetail<ActivityDetail>(activity.date, activity.activity_id)
      .then(setDetail)
      .catch((err) => setError(err.message))

    setJournalStatus('loading')
    fetchJournalEntryForActivity(activity.date, activity.activity_id)
      .then((entry) => {
        if (entry) {
          setRpe(entry.rpe)
          setFeeling(entry.feeling as Feeling)
          setNote(entry.note)
        }
        setJournalStatus('idle')
      })
      .catch((err) => {
        setJournalError(err.message)
        setJournalStatus('error')
      })
  }, [activity])

  async function handleSaveJournal() {
    setJournalStatus('saving')
    setJournalError(null)
    try {
      await upsertJournalEntry(activity.date, {
        created_at: new Date().toISOString(),
        rpe,
        feeling,
        note: note.trim(),
        activity_id: activity.activity_id,
      })
      setJournalStatus('saved')
    } catch (err) {
      setJournalStatus('error')
      setJournalError(err instanceof Error ? err.message : 'Kunne ikke lagre')
    }
  }

  const laps = detail?.splits?.lapDTOs ?? []
  const lapPoints: LapPoint[] = laps.map((lap, i) => ({
    lap: i + 1,
    paceMinPerKm: lap.distance ? lap.duration / 60 / (lap.distance / 1000) : null,
    avgHR: lap.averageHR ?? null,
    elevationGain: lap.elevationGain ?? null,
    intensityType: lap.intensityType ?? null,
  }))
  const activeLaps = laps.filter((l) => l.intensityType === 'ACTIVE')
  const isStructured = activeLaps.length > 0
  const activeSummary = isStructured ? activeLapsSummary(laps) : null
  const hasElevation = laps.some((l) => (l.elevationGain ?? 0) > 0)

  const displayPaceFormatted = activeSummary
    ? (() => {
        const mins = Math.floor(activeSummary.paceMinPerKm)
        const secs = Math.round((activeSummary.paceMinPerKm - mins) * 60)
        return `${mins}:${secs.toString().padStart(2, '0')}/km`
      })()
    : formatPaceMinPerKm(activity.distance_km, activity.duration_min)
  const displayHr = activeSummary?.avgHr ?? activity.avg_hr

  const SessionIcon = activity.classified_session_type ? SESSION_ICON[activity.classified_session_type] : Footprints
  const sessionColor = activity.classified_session_type
    ? SESSION_COLOR[activity.classified_session_type]
    : 'var(--series-blue)'
  const sessionLabel = activity.classified_session_type
    ? SESSION_LABEL[activity.classified_session_type]
    : activity.type ?? 'Aktivitet'

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="badge" style={{ color: sessionColor, marginBottom: 6 }}>
          <SessionIcon />
          {sessionLabel}
        </div>
        <h2 style={{ marginBottom: 12 }}>{activity.name ?? 'Aktivitet'}</h2>

        <div className="stat-row" style={{ marginBottom: 16 }}>
          <div className="stat-tile">
            <span className="label">Distanse</span>
            <span className="value tabular">{activity.distance_km.toFixed(2)} km</span>
          </div>
          <div className="stat-tile">
            <span className="label">{activeSummary ? 'Snittfart (aktive drag)' : 'Snittfart'}</span>
            <span className="value tabular">{displayPaceFormatted}</span>
          </div>
          <div className="stat-tile">
            <span className="label">{activeSummary ? 'Snittpuls (aktive drag)' : 'Snittpuls'}</span>
            <span className="value tabular">{displayHr ?? '—'} bpm</span>
          </div>
          <div className="stat-tile">
            <span className="label">Varighet</span>
            <span className="value tabular">{activity.duration_min.toFixed(0)} min</span>
          </div>
        </div>

        {error && <p className="sync-status error">{error}</p>}
        {!detail && !error && <p className="hero-note">Laster splits…</p>}

        {isStructured && (
          <>
            <div className="field-label">Intervaller ({activeLaps.length})</div>
            <div className="table-scroll" style={{ marginBottom: 16 }}>
              <table className="activity-table responsive-table">
                <thead>
                  <tr>
                    <th>Drag</th>
                    <th>Distanse</th>
                    <th>Tempo</th>
                    <th>Puls</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLaps.map((lap, i) => (
                    <tr key={i} style={{ cursor: 'default' }}>
                      <td data-label="Drag">Intervall {i + 1}</td>
                      <td data-label="Distanse" className="tabular">
                        {((lap.distance || 0) / 1000).toFixed(2)} km
                      </td>
                      <td data-label="Tempo" className="tabular">
                        {lap.distance ? formatPaceMinPerKm(lap.distance / 1000, lap.duration / 60) : '—'}
                      </td>
                      <td data-label="Puls" className="tabular">
                        {lap.averageHR ?? '—'} bpm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {lapPoints.length > 0 && (
          <>
            <div className="field-label">Tempo per lap (min/km)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={lapPoints} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="lap" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<PaceTooltip />} />
                <Line
                  type="monotone"
                  dataKey="paceMinPerKm"
                  stroke="var(--series-blue)"
                  strokeWidth={2}
                  dot={<IntensityDot />}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="field-label" style={{ marginTop: 16 }}>
              Puls per lap (bpm)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={lapPoints} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="lap" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  width={44}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<HrTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avgHR"
                  stroke="var(--series-orange)"
                  strokeWidth={2}
                  dot={<IntensityDot />}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            {hasElevation && (
              <>
                <div className="field-label" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mountain style={{ width: 13, height: 13, color: 'var(--series-aqua)' }} />
                  Stigning per lap (høydemeter)
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={lapPoints} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--gridline)" vertical={false} />
                    <XAxis dataKey="lap" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={36} />
                    <Tooltip
                      formatter={(v) => [`${Math.round(Number(v))} hm`, 'Stigning']}
                      contentStyle={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      cursor={{ fill: 'var(--gridline)' }}
                    />
                    <Bar dataKey="elevationGain" fill="var(--series-aqua)" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </>
        )}

        {detail && lapPoints.length === 0 && (
          <p className="hero-note">Ingen lap-data registrert for denne aktiviteten.</p>
        )}

        <div className="field-label" style={{ marginTop: 20, marginBottom: 8 }}>
          Hvordan følte du deg på denne økta?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="tt-label" style={{ marginBottom: 6 }}>
              Følelse
            </div>
            <div className="pill-group">
              {FEELINGS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`pill-choice ${feeling === f ? 'active' : ''}`}
                  onClick={() => setFeeling(f)}
                >
                  {FEELING_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
          <label>
            <div className="tt-label" style={{ marginBottom: 4 }}>
              Anstrengelse (RPE {rpe}/10)
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            <div className="tt-label" style={{ marginBottom: 4 }}>
              Kommentar
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Beina tunge? Pusten grei? Noe å huske til neste gang?"
              style={{ resize: 'vertical' }}
            />
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          {journalStatus === 'saved' && <span className="hero-note">Lagret ✓</span>}
          {journalStatus === 'error' && <span className="sync-status error">{journalError}</span>}
          <button
            className="button-primary"
            onClick={handleSaveJournal}
            disabled={journalStatus === 'saving' || journalStatus === 'loading'}
          >
            {journalStatus === 'saving' ? 'Lagrer…' : 'Lagre notat'}
          </button>
          <button className="button-secondary" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
