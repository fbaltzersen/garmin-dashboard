import { useState } from 'react'
import { upsertJournalEntry } from '../api/journal'
import { FEELINGS, FEELING_LABEL, type Feeling } from '../journalOptions'
import { Panel } from './Panel'

export function JournalForm() {
  const [rpe, setRpe] = useState(5)
  const [feeling, setFeeling] = useState<Feeling>('ok')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setStatus('saving')
    setError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      await upsertJournalEntry(today, {
        created_at: new Date().toISOString(),
        rpe,
        feeling,
        note: note.trim(),
      })
      setStatus('saved')
      setNote('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre')
    }
  }

  return (
    <Panel title="Logg dagen (uten en spesifikk økt)">
      <p className="hero-note" style={{ marginBottom: 12 }}>
        For hviledager, sykdom eller annet som ikke er knyttet til en Garmin-registrert økt. For å
        logge en gjennomført økt, klikk på økten i "Siste aktiviteter" under.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
        <label>
          <div className="hero-label" style={{ marginBottom: 4 }}>
            Følelse
          </div>
          <select
            value={feeling}
            onChange={(e) => setFeeling(e.target.value as Feeling)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--page)',
              color: 'var(--text-primary)',
              font: 'inherit',
            }}
          >
            {FEELINGS.map((f) => (
              <option key={f} value={f}>
                {FEELING_LABEL[f]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div className="hero-label" style={{ marginBottom: 4 }}>
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
          <div className="hero-label" style={{ marginBottom: 4 }}>
            Kommentar
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hvordan var dagen? Noe å notere til neste ukes plan?"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--page)',
              color: 'var(--text-primary)',
              font: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>

        <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="button-primary" onClick={handleSubmit} disabled={status === 'saving'}>
            {status === 'saving' ? 'Lagrer…' : 'Lagre logg'}
          </button>
          {status === 'saved' && <span className="hero-note">Lagret ✓</span>}
          {status === 'error' && <span className="sync-status error">{error}</span>}
        </div>
      </div>
    </Panel>
  )
}
