'use client'

import { useState } from 'react'
import { User } from 'firebase/auth'
import { X, Flag, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const REPORT_REASONS = [
  'Prohibited or illegal item',
  'Counterfeit / fake product',
  'Misleading product description',
  'Incorrect or fraudulent price',
  'Stolen goods',
  'Duplicate or spam listing',
  'Offensive or inappropriate content',
  'Wrong category / misclassified',
  'Item already sold, still listed',
  'Suspected scam or fraud',
  'Seller harassment or abuse',
  'Other',
]

interface Props {
  open: boolean
  onClose: () => void
  productId: string
  currentUser: User | null
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function ReportDialog({ open, onClose, productId, currentUser }: Props) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const reset = () => {
    setReason('')
    setDetails('')
    setStatus('idle')
    setErrorMsg('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!reason) { setErrorMsg('Please select a reason.'); return }
    if (!currentUser) { setErrorMsg('You must be signed in to report a listing.'); return }

    try {
      setStatus('loading')
      setErrorMsg('')
      const token = await currentUser.getIdToken()

      const res = await fetch('/api/reports/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, reason, details }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to submit report')

      setStatus('success')
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              <h2 className="text-base font-semibold text-foreground">Report Listing</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {status === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <p className="font-semibold text-foreground">Report Submitted</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Thank you. Our team will review this listing and take appropriate action.
                </p>
                <Button className="mt-2" onClick={handleClose}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Help us keep U Mart safe. Tell us what's wrong with this listing.
                </p>

                {/* Reason dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reason <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => { setReason(e.target.value); setErrorMsg('') }}
                    disabled={status === 'loading'}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                  >
                    <option value="">Select a reason…</option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Details textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Additional details <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    disabled={status === 'loading'}
                    placeholder="Provide any extra context that will help our team…"
                    rows={4}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none disabled:opacity-50"
                  />
                </div>

                {/* Error */}
                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={status === 'loading'}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="destructive"
                    onClick={handleSubmit}
                    disabled={status === 'loading' || !reason}
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Flag className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}