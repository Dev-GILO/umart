'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface DeleteDialogProps {
  refId:     string
  onCancel:  () => void
  onConfirm: () => Promise<void>
}

export function DeleteDialog({ refId, onCancel, onConfirm }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try { await onConfirm() } finally { setDeleting(false) }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive"/>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Delete Reference</p>
            <p className="text-[0.65rem] font-mono text-muted-foreground">{refId}</p>
          </div>
          <button onClick={onCancel}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            This will <span className="text-destructive font-semibold">erase the transaction from the system</span>. Is this what you really want?
          </p>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-1.5">
            <p className="text-[0.7rem] font-semibold text-destructive uppercase tracking-wide">What will happen:</p>
            {[
              'The reference document will be permanently deleted',
              'The refId will be removed from both buyer and seller transaction arrays',
              'A copy will be archived in deleted_references with your admin ID',
              'A deleted_refs entry will be added to both user profiles',
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-destructive text-[0.65rem] mt-0.5 shrink-0">›</span>
                <p className="text-[0.7rem] text-muted-foreground">{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border bg-muted/30">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold
              text-muted-foreground border border-border hover:bg-muted hover:text-foreground
              transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold
              bg-destructive text-destructive-foreground hover:bg-destructive/90
              transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5"/>
            {deleting ? 'Deleting…' : 'Yes, delete it'}
          </button>
        </div>
      </div>
    </div>
  )
}