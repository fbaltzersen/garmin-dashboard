import { useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound } from 'lucide-react'
import { setToken } from '../api/github'

export function PatModal({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState('')

  function save() {
    if (!value.trim()) return
    setToken(value)
    onSaved()
  }

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-box">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--series-blue) 16%, transparent)',
            color: 'var(--series-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <KeyRound style={{ width: 20, height: 20 }} />
        </div>
        <h2>Koble til GarminData</h2>
        <p>
          Lim inn en finkornet GitHub Personal Access Token med tilgang til{' '}
          <code>fbaltzersen/GarminData</code> (permissions: Contents: Read and write, Actions:
          Read and write). Tokenet lagres kun i denne nettleseren.
        </p>
        <input
          type="password"
          placeholder="github_pat_..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          autoFocus
        />
        <div className="modal-actions">
          <button className="button-primary" onClick={save}>
            Lagre
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
