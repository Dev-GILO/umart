'use client'

import { Info } from 'lucide-react'

interface Props {
  info: Record<string, string>
}

export function AdditionalInfo({ info }: Props) {
  const entries = Object.entries(info)
  if (!entries.length) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>
      </div>
      <div className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-2.5 gap-4">
            <span className="text-sm text-muted-foreground capitalize">{key}</span>
            <span className="text-sm font-medium text-foreground text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}