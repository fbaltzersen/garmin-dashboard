import { useState } from 'react'

export function PlanCommentModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (note: string) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Kommentar til planen?</h2>
        <p>
          Noe du vil at AI skal ta hensyn til denne gangen, utover det dataen viser? Valgfritt —
          du kan hoppe over dette.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          autoFocus
          placeholder="F.eks. «beina er tunge etter i går» eller «hopp over intervaller denne uka»"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--page)',
            color: 'var(--text-primary)',
            font: 'inherit',
            resize: 'vertical',
            margin: '12px 0',
          }}
        />
        <div className="modal-actions">
          <button className="button-secondary" onClick={() => onSubmit('')}>
            Hopp over
          </button>
          <button className="button-primary" onClick={() => onSubmit(note.trim())}>
            Generer plan
          </button>
        </div>
      </div>
    </div>
  )
}
