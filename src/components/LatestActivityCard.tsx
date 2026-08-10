import { useEffect, useState } from 'react'
import { Activity, Footprints, Gauge, Heart, MessageSquareQuote } from 'lucide-react'
import { fetchJournalEntryForActivity, upsertJournalEntry } from '../api/journal'
import { FEELINGS, FEELING_LABEL, type Feeling } from '../journalOptions'
import type { ActivitySummary } from '../types'
import { Panel } from './Panel'
import { formatDate, formatPaceMinPerKm } from '../utils/format'

export function LatestActivityCard({ activity }: { activity: ActivitySummary | null }) {
  const [rpe, setRpe] = useState(5)
  const [feeling, setFeeling] = useState<Feeling>('ok')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activity) {
      setStatus('idle')
      return
    }
    setStatus('loading')
    setRpe(5)
    setFeeling('ok')
    setNote('')
    fetchJournalEntryForActivity(activity.date, activity.activity_id)
      .then((entry) => {
        if (entry) {
          setRpe(entry.rpe)
          setFeeling(entry.feeling as Feeling)
          setNote(entry.note)
        }
        setStatus('idle')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [activity])

  async function handleSave() {
    if (!activity) return
    setStatus('saving')
    setError(null)
    try {
      await upsertJournalEntry(activity.date, {
        created_at: new Date().toISOString(),
        rpe,
        feeling,
        note: note.trim(),
        activity_id: activity.activity_id,
      })
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre')
    }
  }

  if (!activity) {
    return (
      <Panel title="Siste økt" icon={Activity}>
        <p className="hero-note">Ingen aktiviteter registrert ennå.</p>
      </Panel>
    )
  }

  return (
    <Panel title="Siste økt" icon={Activity}>
      <div className="hero-label" style={{ marginBottom: 4 }}>
        {formatDate(activity.date)}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, marginBottom: 10 }}>
        {activity.name ?? activity.type ?? 'Aktivitet'}
      </div>

      <div className="inline-stat-row" style={{ marginBottom: 14 }}>
        <span className="inline-stat">
          <Footprints />
          <strong className="tabular">{activity.distance_km.toFixed(2)} km</strong>
        </span>
        <span className="inline-stat">
          <Gauge />
          <strong className="tabular">{formatPaceMinPerKm(activity.distance_km, activity.duration_min)}</strong>
        </span>
        {activity.avg_hr && (
          <span className="inline-stat">
            <Heart />
            <strong className="tabular">{activity.avg_hr} bpm</strong>
          </span>
        )}
      </div>

      {activity.garmin_note && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            padding: '10px 12px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <MessageSquareQuote style={{ width: 16, height: 16, color: 'var(--series-blue)', flex: 'none', marginTop: 2 }} />
          <div>
            <div className="tt-label" style={{ marginBottom: 2 }}>
              Merknad fra Garmin
            </div>
            <p style={{ fontStyle: 'italic', margin: 0 }}>{activity.garmin_note}</p>
          </div>
        </div>
      )}

      <div className="field-label">Hvordan følte du deg?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
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
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--page)',
              color: 'var(--text-primary)',
              font: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>
        <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
          <button
            className="button-primary"
            onClick={handleSave}
            disabled={status === 'saving' || status === 'loading'}
          >
            {status === 'saving' ? 'Lagrer…' : 'Lagre notat'}
          </button>
          {status === 'saved' && <span className="hero-note">Lagret ✓</span>}
          {status === 'error' && <span className="sync-status error">{error}</span>}
        </div>
      </div>
    </Panel>
  )
}
