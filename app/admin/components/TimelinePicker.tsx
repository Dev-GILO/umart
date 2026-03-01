'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Eye, GitCompare, Search, X } from 'lucide-react'

export type TimelinePeriod = 'daily' | 'monthly' | 'yearly'
export type TimelineMode   = 'view' | 'compare'

export interface TimelineSelection {
  mode: TimelineMode
  ids:  string[]
}

interface TimelinePickerProps {
  period:   TimelinePeriod
  onSearch: (selection: TimelineSelection) => void
  onClear:  () => void
  loading?: boolean
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function pad(n: number) { return String(n).padStart(2, '0') }
function toDailyId(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}` }
function toMonthId(y: number, m: number)             { return `${y}-${pad(m+1)}` }
function toYearId(y: number)                         { return `${y}` }

function formatDailyId(id: string) {
  const [y,m,d] = id.split('-')
  return new Date(+y, +m-1, +d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}
function formatMonthId(id: string) {
  const [y,m] = id.split('-')
  return `${MONTHS[+m-1]} ${y}`
}
function formatId(id: string, period: TimelinePeriod) {
  if (period === 'daily')   return formatDailyId(id)
  if (period === 'monthly') return formatMonthId(id)
  return id
}

// ── Shared nav button ──────────────────────────────────────────────────────────
function NavBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
      {children}
    </button>
  )
}

// ── Day picker ────────────────────────────────────────────────────────────────
function DayPicker({ selected, onSelect }: { selected: string|null; onSelect: (id:string)=>void }) {
  const today = new Date()
  const [viewY, setViewY] = useState(today.getFullYear())
  const [viewM, setViewM] = useState(today.getMonth())
  const firstDay    = new Date(viewY, viewM, 1).getDay()
  const daysInMonth = new Date(viewY, viewM+1, 0).getDate()
  const todayId     = toDailyId(today.getFullYear(), today.getMonth(), today.getDate())
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)]
  function prev() { if (viewM===0){setViewY(y=>y-1);setViewM(11)}else setViewM(m=>m-1) }
  function next() { if (viewM===11){setViewY(y=>y+1);setViewM(0)}else setViewM(m=>m+1) }
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <NavBtn onClick={prev}><ChevronLeft className="w-4 h-4"/></NavBtn>
        <span className="text-xs font-semibold text-foreground font-mono">{MONTHS[viewM]} {viewY}</span>
        <NavBtn onClick={next}><ChevronRight className="w-4 h-4"/></NavBtn>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d=><div key={d} className="text-center text-[0.6rem] font-semibold text-muted-foreground/60 py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>
          const id=toDailyId(viewY,viewM,day)
          const isSel=id===selected, isToday=id===todayId, isFuture=id>todayId
          return (
            <button key={id} disabled={isFuture} onClick={()=>onSelect(id)}
              className={`text-[0.7rem] rounded py-1 font-mono transition-colors
                ${isFuture ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                ${isSel ? 'bg-primary/15 text-primary-foreground bg-primary font-bold' : ''}
                ${isToday&&!isSel ? 'text-primary font-semibold' : !isSel&&!isFuture ? 'text-foreground' : ''}`}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Month picker ──────────────────────────────────────────────────────────────
function MonthPicker({ selected, onSelect }: { selected: string|null; onSelect: (id:string)=>void }) {
  const today = new Date()
  const [viewY, setViewY] = useState(today.getFullYear())
  const currentId = toMonthId(today.getFullYear(), today.getMonth())
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <NavBtn onClick={()=>setViewY(y=>y-1)}><ChevronLeft className="w-4 h-4"/></NavBtn>
        <span className="text-xs font-semibold text-foreground font-mono">{viewY}</span>
        <NavBtn onClick={()=>setViewY(y=>y+1)}><ChevronRight className="w-4 h-4"/></NavBtn>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((name,i)=>{
          const id=toMonthId(viewY,i)
          const isSel=id===selected, isCur=id===currentId, isFuture=id>currentId
          return (
            <button key={id} disabled={isFuture} onClick={()=>onSelect(id)}
              className={`text-xs rounded-lg py-2 font-mono transition-colors
                ${isFuture ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                ${isSel ? 'bg-primary text-primary-foreground font-bold' : ''}
                ${isCur&&!isSel ? 'text-primary font-semibold' : !isSel&&!isFuture ? 'text-foreground' : ''}`}>
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Year picker ───────────────────────────────────────────────────────────────
function YearPicker({ selected, onSelect }: { selected: string|null; onSelect: (id:string)=>void }) {
  const currentYear = new Date().getFullYear()
  const [page, setPage] = useState(0)
  const startYear = currentYear - 11 - page * 12
  const years = Array.from({length:12},(_,i)=>startYear+i).filter(y=>y<=currentYear)
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <NavBtn onClick={()=>setPage(p=>p+1)}><ChevronLeft className="w-4 h-4"/></NavBtn>
        <span className="text-xs font-semibold text-foreground font-mono">{startYear} – {currentYear-page*12}</span>
        <NavBtn onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}><ChevronRight className="w-4 h-4"/></NavBtn>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {years.map(y=>{
          const id=toYearId(y), isSel=id===selected, isCur=y===currentYear
          return (
            <button key={id} onClick={()=>onSelect(id)}
              className={`text-xs rounded-lg py-2 font-mono transition-colors hover:bg-muted cursor-pointer
                ${isSel ? 'bg-primary text-primary-foreground font-bold' : ''}
                ${isCur&&!isSel ? 'text-primary font-semibold' : !isSel ? 'text-foreground' : ''}`}>
              {y}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function TimelinePicker({ period, onSearch, onClear, loading }: TimelinePickerProps) {
  const [mode,   setMode]   = useState<TimelineMode>('view')
  const [selA,   setSelA]   = useState<string|null>(null)
  const [selB,   setSelB]   = useState<string|null>(null)
  const [active, setActive] = useState<'A'|'B'>('A')

  const reset = useCallback(()=>{ setSelA(null); setSelB(null); setActive('A'); onClear() },[onClear])
  const handleSelect = useCallback((id:string)=>{
    if(mode==='view'){ setSelA(id) }
    else { if(active==='A'){ setSelA(id); if(!selB) setActive('B') } else setSelB(id) }
  },[mode,active,selB])
  const canSearch = mode==='view' ? selA!==null : selA!==null&&selB!==null
  const handleSearch = useCallback(()=>{
    if(!canSearch) return
    if(mode==='view') onSearch({ mode:'view', ids:[selA!] })
    else onSearch({ mode:'compare', ids:[selA!,selB!].sort() })
  },[canSearch,mode,selA,selB,onSearch])

  const Picker = period==='daily' ? DayPicker : period==='monthly' ? MonthPicker : YearPicker

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground flex-1">Timeline</p>
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted border border-border">
          {(['view','compare'] as TimelineMode[]).map(m=>(
            <button key={m} onClick={()=>{ setMode(m); setSelA(null); setSelB(null); setActive('A'); onClear() }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.7rem] font-medium transition-all
                ${mode===m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {m==='view' ? <Eye className="w-3 h-3"/> : <GitCompare className="w-3 h-3"/>}
              {m==='view' ? 'View' : 'Compare'}
            </button>
          ))}
        </div>
      </div>

      {/* Compare slots */}
      {mode==='compare' && (
        <div className="flex gap-2">
          {(['A','B'] as const).map(slot=>{
            const id=slot==='A'?selA:selB, isActive=active===slot&&!id, isSel=!!id
            return (
              <button key={slot} onClick={()=>setActive(slot)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all
                  ${isActive ? 'border-primary/40 bg-primary/10 text-primary' : ''}
                  ${isSel ? 'border-border bg-muted text-foreground' : ''}
                  ${!isActive&&!isSel ? 'border-border bg-background text-muted-foreground hover:text-foreground' : ''}`}>
                <span className={`w-4 h-4 rounded-full text-[0.6rem] font-bold flex items-center justify-center shrink-0
                  ${isActive ? 'bg-primary text-primary-foreground' : isSel ? 'bg-muted-foreground/40 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {slot}
                </span>
                <span className="truncate font-mono">{id ? formatId(id,period) : `Pick period ${slot}`}</span>
                {isSel && <X className="w-3 h-3 ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={e=>{ e.stopPropagation(); slot==='A'?setSelA(null):setSelB(null); setActive(slot) }}/>}
              </button>
            )
          })}
        </div>
      )}

      {/* View: selected indicator */}
      {mode==='view' && selA && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Eye className="w-3 h-3 text-primary shrink-0"/>
          <span className="text-xs font-mono text-primary flex-1">{formatId(selA,period)}</span>
          <button onClick={()=>{ setSelA(null); onClear() }} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3"/></button>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-lg border border-border bg-background p-3">
        <Picker selected={mode==='view'?selA:active==='A'?selA:selB} onSelect={handleSelect}/>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={handleSearch} disabled={!canSearch||loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold
            bg-primary text-primary-foreground hover:bg-primary/90 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed">
          <Search className="w-3.5 h-3.5"/>
          {loading ? 'Loading…' : mode==='view' ? 'View period' : 'Compare periods'}
        </button>
        {(selA||selB) && (
          <button onClick={reset}
            className="px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-all">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}