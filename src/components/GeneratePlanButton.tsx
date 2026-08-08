import { useState } from 'react'
import { PHASE_LABEL, useWorkflowTrigger } from './SyncButton'
import { PlanCommentModal } from './PlanCommentModal'

export function GeneratePlanButton({ idleLabel, onSuccess }: { idleLabel: string; onSuccess: () => void }) {
  const { state, busy, trigger } = useWorkflowTrigger('generate_plan.yml', onSuccess)
  const [showModal, setShowModal] = useState(false)

  function handleSubmit(note: string) {
    setShowModal(false)
    trigger(note ? { user_note: note } : undefined)
  }

  const label = state.phase === 'idle' ? idleLabel : busy ? 'Genererer plan…' : PHASE_LABEL[state.phase]

  return (
    <div>
      <button className="sync-button" disabled={busy} onClick={() => setShowModal(true)}>
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
      {showModal && <PlanCommentModal onSubmit={handleSubmit} onCancel={() => setShowModal(false)} />}
    </div>
  )
}
