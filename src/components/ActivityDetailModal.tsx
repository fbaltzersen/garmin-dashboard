import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
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

interface ChartRow {
  x: number
  pace: number | null
  hr: number | null
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

/** Cumulative distance range [start, end] (km) covered by each lap, used to
 * shade where the ACTIVE reps fall on the fine-grained track chart. */
function lapDistanceRanges(laps: ActivityLap[]): { start: number; end: number; intensityType: string | null }[] {
  let cumulative = 0
  return laps.map((lap) => {
    const start = cumulative
    cumulative += (lap.distance || 0) / 1000
    return { start, end: cumulative, intensityType: lap.intensityType ?? null }
  })
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

function makeTooltip(unit: string, byLap: boolean) {
  return function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const p: ChartRow = payload[0].payload
    const value = payload[0].value
    if (value == null) return null
    return (
      <div className="tooltip-box">
        <div className="tt-label">{byLap ? `Lap ${label}` : `${Number(label).toFixed(2)} km`}</div>
        <div>
          {value} {unit}
        </div>
        {p.intensityType && <div className="tt-label">{p.intensityType}</div>}
      </div>
    )
  }
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
  const activeLaps = laps.filter((l) => l.intensityType === 'ACTIVE')
  const isStructured = activeLaps.length > 0
  const activeSummary = isStructured ? activeLapsSummary(laps) : null

  // Prefer the fine-grained (~80-point) track over lap splits, which can be
  // as coarse as a single point for the whole run - track gives a real
  // pace/HR curve across the session instead of one flat number.
  const track = detail?.track ?? null
  const hasTrack = !!track && track.length > 1

  const chartRows: ChartRow[] = hasTrack
    ? track!.map((t) => ({ x: t.distance_km, pace: t.pace_min_per_km, hr: t.hr, intensityType: null }))
    : laps.map((lap, i) => ({
        x: i + 1,
        pace: lap.distance ? lap.duration / 60 / (lap.distance / 1000) : null,
        hr: lap.averageHR ?? null,
        intensityType: lap.intensityType ?? null,
      }))
  const xTickFormatter = hasTrack ? (v: number) => `${v.toFixed(1)} km` : (v: number) => `${v}`
  const activeRanges = hasTrack && isStructured ? lapDistanceRanges(laps).filter((r) => r.intensityType === 'ACTIVE') : []

  const showTrackElevation = hasTrack && track!.some((t) => t.elevation_m != null)
  const showLapElevation = !showTrackElevation && laps.some((l) => (l.elevationGain ?? 0) > 0)
  const trackElevationRows = showTrackElevation ? track!.map((t) => ({ x: t.distance_km, elevation: t.elevation_m })) : null
  const lapElevationRows = showLapElevation
    ? laps.map((lap, i) => ({ x: i + 1, elevationGain: lap.elevationGain ?? null }))
    : null
  const hasElevationChart = showTrackElevation || showLapElevation

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

  const PaceTooltip = makeTooltip('min/km', !hasTrack)
  const HrTooltip = makeTooltip('bpm', !hasTrack)

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
        {!detail && !error && <p className="hero-note">Laster økt-data…</p>}

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

        {chartRows.length > 0 && (
          <>
            <div className="field-label">
              Tempo {hasTrack ? 'gjennom økten' : 'per lap'} (min/km)
              {activeRanges.length > 0 && (
                <span className="tt-label" style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none' }}>
                  · rødt felt = aktivt drag
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={hasTrack ? ['dataMin', 'dataMax'] : undefined}
                  tickFormatter={xTickFormatter}
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<PaceTooltip />} />
                {activeRanges.map((r, i) => (
                  <ReferenceArea key={i} x1={r.start} x2={r.end} fill="var(--status-critical)" fillOpacity={0.1} stroke="none" />
                ))}
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="var(--series-blue)"
                  strokeWidth={2}
                  dot={hasTrack ? false : <IntensityDot />}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="field-label" style={{ marginTop: 16 }}>
              Puls {hasTrack ? 'gjennom økten' : 'per lap'} (bpm)
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={hasTrack ? ['dataMin', 'dataMax'] : undefined}
                  tickFormatter={xTickFormatter}
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  width={44}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<HrTooltip />} />
                {activeRanges.map((r, i) => (
                  <ReferenceArea key={i} x1={r.start} x2={r.end} fill="var(--status-critical)" fillOpacity={0.1} stroke="none" />
                ))}
                <Line
                  type="monotone"
                  dataKey="hr"
                  stroke="var(--series-orange)"
                  strokeWidth={2}
                  dot={hasTrack ? false : <IntensityDot />}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {hasElevationChart && (
              <>
                <div className="field-label" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mountain style={{ width: 13, height: 13, color: 'var(--series-aqua)' }} />
                  {showTrackElevation ? 'Høydeprofil' : 'Stigning per lap (høydemeter)'}
                </div>
                {showTrackElevation ? (
                  <ResponsiveContainer width="100%" height={110}>
                    <ComposedChart data={trackElevationRows!} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="activityElevationFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--series-aqua)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--series-aqua)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--gridline)" vertical={false} />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={xTickFormatter}
                        stroke="var(--baseline)"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={36} />
                      <Tooltip
                        formatter={(v) => [`${Math.round(Number(v))} moh`, 'Høyde']}
                        labelFormatter={(v) => `${Number(v).toFixed(2)} km`}
                        contentStyle={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="elevation"
                        stroke="var(--series-aqua)"
                        fill="url(#activityElevationFill)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={lapElevationRows!} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="var(--gridline)" vertical={false} />
                      <XAxis dataKey="x" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
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
                )}
              </>
            )}
          </>
        )}

        {detail && chartRows.length === 0 && (
          <p className="hero-note">Ingen detaljert økt-data registrert for denne aktiviteten.</p>
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
