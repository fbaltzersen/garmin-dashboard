import { useState } from 'react'
import { fetchRepoJson, GitHubApiError, writeRepoJson } from '../api/github'
import type { JournalEntry } from '../types'
import { Panel } from './Panel'

const FEELINGS = ['bra', 'ok', 'slitent', 'smerte', 'motivert'] as const
const FEELING_LABEL: Record<(typeof FEELINGS)[number], string> = {
  bra: 'Bra',
  ok: 'Grei',
  slitent: 'Slitent',
  smerte: 'Smerte/vondt',
  motivert: 'Motivert',
}

interface DayJournal {
  date: string
  entries: JournalEntry[]
}

export function JournalForm() {
  const [rpe, setRpe] = useState(5)
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]>('ok')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setStatus('saving')
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    const path = `data/journal/${today}.json`
    try {
      const existing = await fetchRepoJson<DayJournal>(path).catch((err) => {
        if (err instanceof GitHubApiError && err.status === 404) return { date: today, entries: [] }
        throw err
      })
      const entry: JournalEntry = {
        created_at: new Date().toISOString(),
        rpe,
        feeling,
        note: note.trim(),
      }
      const updated: DayJournal = { date: today, entries: [...existing.entries, entry] }
      await writeRepoJson(path, updated, `journal: ${today}`)
      setStatus('saved')
      setNote('')
    } catch (err) {
      setStatus('error')
      setError(err instanceof GitHubApiError ? err.message : 'Kunne ikke lagre')
    }
  }

  return (
    <Panel title="Logg dagens økt">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
        <label>
          <div className="hero-label" style={{ marginBottom: 4 }}>
            Følelse
          </div>
          <select
            value={feeling}
            onChange={(e) => setFeeling(e.target.value as (typeof FEELINGS)[number])}
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
            placeholder="Hvordan kjentes økta? Noe å notere til neste ukes plan?"
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
