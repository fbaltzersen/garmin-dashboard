import { useState } from 'react'
import { triggerSyncAndTrack, type SyncState } from '../api/syncTrigger'

const LABELS: Record<SyncState['phase'], string> = {
  idle: 'Synk nå',
  dispatching: 'Starter synk…',
  waiting_for_run: 'Venter på kjøring…',
  queued: 'I kø…',
  in_progress: 'Synker med Garmin…',
  success: 'Ferdig ✓',
  failure: 'Feilet',
  timeout: 'Tar lengre tid enn ventet',
}

export function SyncButton({ onSuccess }: { onSuccess: () => void }) {
  const [state, setState] = useState<SyncState>({ phase: 'idle' })
  const busy = !['idle', 'success', 'failure', 'timeout'].includes(state.phase)

  async function handleClick() {
    await triggerSyncAndTrack((s) => {
      setState(s)
      if (s.phase === 'success') onSuccess()
    })
  }

  return (
    <div>
      <button className="sync-button" disabled={busy} onClick={handleClick}>
        {busy && '⏳ '}
        {LABELS[state.phase]}
      </button>
      {(state.error || state.run) && (
        <div className={`sync-status ${state.phase === 'failure' ? 'error' : ''}`}>
          {state.error}{' '}
          {state.run && (
            <a href={state.run.html_url} target="_blank" rel="noreferrer">
              se kjøring
            </a>
          )}
        </div>
      )}
    </div>
  )
}
