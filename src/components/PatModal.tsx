import { useState } from 'react'
import { setToken } from '../api/github'

export function PatModal({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState('')

  function save() {
    if (!value.trim()) return
    setToken(value)
    onSaved()
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <h2>Koble til GarminData</h2>
        <p>
          Lim inn en finkornet GitHub Personal Access Token med tilgang til{' '}
          <code>fbaltzersen/GarminData</code> (permissions: Contents: Read-only, Actions: Read
          and write). Tokenet lagres kun i denne nettleseren.
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
    </div>
  )
}
