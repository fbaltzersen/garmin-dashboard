import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Footprints } from 'lucide-react'
import { fetchActivityDetail } from '../api/github'
import { fetchJournalEntryForActivity, upsertJournalEntry } from '../api/journal'
import { FEELINGS, FEELING_LABEL, type Feeling } from '../journalOptions'
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
  const laneData = laps.map((lap, i) => ({
    lap: i + 1,
    paceMinPerKm: lap.distance ? lap.duration / 60 / (lap.distance / 1000) : null,
    avgHR: lap.averageHR,
  }))

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="badge" style={{ color: 'var(--series-blue)', marginBottom: 6 }}>
          <Footprints />
          <span className="tt-label">Aktivitet</span>
        </div>
        <h2>{activity.name ?? 'Aktivitet'}</h2>
        <p>
          {activity.distance_km} km · {activity.duration_min.toFixed(0)} min
          {activity.avg_hr ? ` · ${activity.avg_hr} bpm snitt` : ''}
        </p>
        {error && <p className="sync-status error">{error}</p>}
        {!detail && !error && <p className="hero-note">Laster splits…</p>}
        {laneData.length > 0 && (
          <>
            <div className="field-label" style={{ marginTop: 16 }}>
              Tempo per lap (min/km)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={laneData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lapPaceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-blue)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--series-blue)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="lap" stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(2)} min/km`, 'Tempo']}
                  contentStyle={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  cursor={{ fill: 'var(--gridline)' }}
                />
                <Bar dataKey="paceMinPerKm" fill="url(#lapPaceFill)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {detail && laneData.length === 0 && (
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
