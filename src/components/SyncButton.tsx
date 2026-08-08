import { useState } from 'react'
import { triggerWorkflowAndTrack, type SyncState } from '../api/syncTrigger'

const PHASE_LABEL: Record<SyncState['phase'], string> = {
  idle: '',
  dispatching: 'Starter…',
  waiting_for_run: 'Venter på kjøring…',
  queued: 'I kø…',
  in_progress: 'Kjører…',
  success: 'Ferdig ✓',
  failure: 'Feilet',
  timeout: 'Tar lengre tid enn ventet',
}

export function WorkflowButton({
  workflowFile,
  idleLabel,
  runningLabel,
  onSuccess,
}: {
  workflowFile: string
  idleLabel: string
  runningLabel: string
  onSuccess: () => void
}) {
  const [state, setState] = useState<SyncState>({ phase: 'idle' })
  const busy = !['idle', 'success', 'failure', 'timeout'].includes(state.phase)

  async function handleClick() {
    await triggerWorkflowAndTrack(workflowFile, (s) => {
      setState(s)
      if (s.phase === 'success') onSuccess()
    })
  }

  const label = state.phase === 'idle' ? idleLabel : busy ? runningLabel : PHASE_LABEL[state.phase]

  return (
    <div>
      <button className="sync-button" disabled={busy} onClick={handleClick}>
        {busy && '⏳ '}
        {label}
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

export function SyncButton({ onSuccess }: { onSuccess: () => void }) {
  return (
    <WorkflowButton
      workflowFile="sync.yml"
      idleLabel="Synk nå"
      runningLabel="Synker med Garmin…"
      onSuccess={onSuccess}
    />
  )
}
