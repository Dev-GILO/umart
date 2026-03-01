'use client'

import { CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react'
import { convertToDate, formatDateTime } from '@/lib/timestamp'

interface WithdrawStatusProps {
  status: 'pending' | 'paid' | 'failed'
  pendingAt?: any   // Firestore Timestamp / ISO string / number
  paidAt?: any
  payoutAmount: number
}

const SUPPORT_URL = 'https://support.umart.com.ng'
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export function WithdrawStatus({
  status,
  pendingAt,
  paidAt,
  payoutAmount,
}: WithdrawStatusProps) {
  const pendingDate = pendingAt ? convertToDate(pendingAt) : null
  const paidDate = paidAt ? convertToDate(paidAt) : null

  const isStale =
    status === 'pending' &&
    pendingDate != null &&
    Date.now() - pendingDate.getTime() > TWO_DAYS_MS

  // ── Failed state ────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Withdrawal Failed</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Something went wrong with your withdrawal. Contact support for help.
            </p>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Contact Support <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        {pendingDate && (
          <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
            Requested on {formatDateTime(pendingDate)}
          </div>
        )}
      </div>
    )
  }

  // ── Pending / Paid state — linear progress ──────────────────────────────────
  const isPaid = status === 'paid'

  return (
    <div className="space-y-6">
      {/* Amount */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Withdrawal Amount
        </p>
        <p className="text-3xl font-extrabold tracking-tight text-primary">
          ₦{payoutAmount.toLocaleString()}
        </p>
      </div>

      {/* Linear step tracker */}
      <div className="relative flex items-start justify-between gap-2">
        {/* Connector line — behind the dots */}
        <div className="absolute top-4 left-[calc(50%-50%+20px)] right-[calc(50%-50%+20px)] h-0.5 bg-border z-0">
          <div
            className={`h-full bg-primary transition-all duration-700 ease-out ${
              isPaid ? 'w-full' : 'w-0'
            }`}
          />
        </div>

        {/* Step: Pending */}
        <Step
          label="Pending"
          date={pendingDate}
          active
          done={isPaid}
        />

        {/* Step: Paid */}
        <Step
          label="Paid"
          date={paidDate}
          active={isPaid}
          done={isPaid}
        />
      </div>

      {/* Stale warning */}
      {isStale && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-center space-y-1">
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            This withdrawal has been pending for over 2 days.
          </p>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Contact Support <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: individual step ────────────────────────────────────────────
function Step({
  label,
  date,
  active,
  done,
}: {
  label: string
  date: Date | null
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-2 z-10 flex-1">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
          ${done
            ? 'bg-primary border-primary text-primary-foreground'
            : active
            ? 'bg-background border-primary text-primary'
            : 'bg-background border-border text-muted-foreground'
          }
        `}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>
      <div className="text-center">
        <p className={`text-xs font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </p>
        {date && (
          <p className="text-[0.65rem] text-muted-foreground mt-0.5 leading-tight">
            {formatDateTime(date)}
          </p>
        )}
      </div>
    </div>
  )
}