/**
 * useDateData.ts
 * Pure date helpers — no browser APIs, safe to use server-side too.
 * Computes Firestore document IDs for current/previous periods.
 */

/** Zero-pad a number to 2 digits */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Today as YYYY-MM-DD */
export function getTodayId(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Yesterday as YYYY-MM-DD */
export function getYesterdayId(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** This month as YYYY-MM */
export function getCurrentMonthId(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

/** Previous month as YYYY-MM */
export function getPreviousMonthId(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** This year as YYYY */
export function getCurrentYearId(): string {
  return String(new Date().getFullYear())
}

/** Previous year as YYYY */
export function getPreviousYearId(): string {
  return String(new Date().getFullYear() - 1)
}

/** Returns [currentId, previousId] for each period */
export function getDailyIds(): [string, string] {
  return [getTodayId(), getYesterdayId()]
}

export function getMonthlyIds(): [string, string] {
  return [getCurrentMonthId(), getPreviousMonthId()]
}

export function getYearlyIds(): [string, string] {
  return [getCurrentYearId(), getPreviousYearId()]
}

/**
 * Given a start and end date string (YYYY-MM-DD), returns all
 * date IDs in that range inclusive.
 */
export function getDailyRange(start: string, end: string): string[] {
  const ids: string[] = []
  const s = new Date(start)
  const e = new Date(end)
  const cur = new Date(s)
  while (cur <= e) {
    ids.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`)
    cur.setDate(cur.getDate() + 1)
  }
  return ids
}

/**
 * Given a start and end month string (YYYY-MM), returns all
 * month IDs in that range inclusive.
 */
export function getMonthlyRange(start: string, end: string): string[] {
  const ids: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    ids.push(`${y}-${pad(m)}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return ids
}

/**
 * Given a start and end year string (YYYY), returns all year IDs inclusive.
 */
export function getYearlyRange(start: string, end: string): string[] {
  const ids: string[] = []
  for (let y = parseInt(start); y <= parseInt(end); y++) {
    ids.push(String(y))
  }
  return ids
}

/** Human-readable label for a daily ID */
export function formatDayLabel(id: string): string {
  const [y, m, d] = id.split('-')
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Normal label for a monthly ID */
export function formatMonthLabel(id: string): string {
  const [year, m] = id.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} '${year.slice(2)}`
}