'use client'

import { useState, useCallback } from 'react'
import { Daily }   from './components/daily'
import { Monthly } from './components/monthly'
import { Yearly }  from './components/yearly'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CalendarDays, CalendarRange, BarChart3, RefreshCw } from 'lucide-react'

type Tab = 'daily' | 'monthly' | 'yearly'
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'daily',   label: 'Daily',   icon: CalendarDays  },
  { id: 'monthly', label: 'Monthly', icon: CalendarRange },
  { id: 'yearly',  label: 'Yearly',  icon: BarChart3     },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('daily')
  const [spinning,  setSpinning]  = useState(false)
  const { daily, monthly, yearly, global, loading, error, refresh } = useAnalytics()

  const handleRefresh = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    refresh()
    setTimeout(() => setSpinning(false), 700)
  }, [spinning, refresh])

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5 sm:space-y-6 max-w-6xl w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-xs text-muted-foreground">Platform metrics · Refreshes every 30s</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={spinning}
          aria-label="Refresh analytics"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            text-muted-foreground hover:text-foreground hover:bg-muted
            border border-border transition-all duration-150 shrink-0 mt-1
            disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`}/>
          <span className="hidden sm:inline">{spinning ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load analytics: {error}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-muted border border-border">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                flex-1 sm:flex-none whitespace-nowrap transition-all duration-200
                ${active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}>
              <Icon className="w-3.5 h-3.5 shrink-0"/>
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="pb-8">
        {activeTab === 'daily'   && <Daily   docs={daily}   global={global} loading={loading}/>}
        {activeTab === 'monthly' && <Monthly docs={monthly} global={global} loading={loading}/>}
        {activeTab === 'yearly'  && <Yearly  docs={yearly}  global={global} loading={loading}/>}
      </div>
    </div>
  )
}