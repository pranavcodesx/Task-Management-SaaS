/** Date helpers. Everything is based on the real "today" — nothing is hard-coded. */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Parse "YYYY-MM-DD" as a local date (new Date('YYYY-MM-DD') would be UTC). */
export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export function startOfWeek(d: Date): Date {
  return addDays(d, -d.getDay())
}

export function diffDays(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO)
  const b = parseISODate(toISO)
  if (!a || !b) return 0
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function longToday(now = new Date()): string {
  return now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** "Today", "Tomorrow", "3 days left", "2 days overdue". */
export function dueLabel(dueISO: string, done = false): { text: string; tone: 'overdue' | 'soon' | 'normal' | 'done' } {
  if (done) return { text: 'Done', tone: 'done' }
  const n = diffDays(todayISO(), dueISO)
  if (n < -1) return { text: `${Math.abs(n)} days overdue`, tone: 'overdue' }
  if (n === -1) return { text: '1 day overdue', tone: 'overdue' }
  if (n === 0) return { text: 'Due today', tone: 'soon' }
  if (n === 1) return { text: 'Due tomorrow', tone: 'soon' }
  if (n <= 3) return { text: `${n} days left`, tone: 'soon' }
  return { text: `${n} days left`, tone: 'normal' }
}

let datePref = 'DD MMM YYYY'
export function setDatePreference(pref: string) {
  datePref = pref
}

export function formatDate(value: string): string {
  const d = parseISODate(value)
  if (!d) return value
  if (datePref === 'YYYY-MM-DD') return toISODate(d)
  if (datePref === 'MM/DD/YYYY') {
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const mins = Math.round((Date.now() - t) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days === 1 ? '1d ago' : `${days}d ago`
}
