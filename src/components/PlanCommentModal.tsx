import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquarePlus } from 'lucide-react'

export function PlanCommentModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (note: string) => void
  onCancel: () => void
}) {
  const [note, setNote] = useState('')

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
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
          <MessageSquarePlus style={{ width: 20, height: 20 }} />
        </div>
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
          style={{ margin: '12px 0', resize: 'vertical' }}
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
    </div>,
    document.body,
  )
}
