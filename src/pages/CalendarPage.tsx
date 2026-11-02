import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { DueDate, PageHeader, PriorityBadge } from '../components/ui'
import { TaskModal, type TaskDefaults } from '../components/TaskModal'
import { addDays, formatDate, parseISODate, startOfWeek, toISODate, todayISO } from '../lib/dates'
import type { Priority, Task } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const chipTone: Record<Priority, string> = {
  high: 'bg-red-50 text-danger',
  medium: 'bg-amber-50 text-warning',
  low: 'bg-emerald-50 text-success',
}
const dotTone: Record<Priority, string> = { high: 'bg-danger', medium: 'bg-warning', low: 'bg-success' }

export function CalendarPage() {
  const { tasks } = useApp()
  const today = todayISO()
  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selected, setSelected] = useState(today)
  const [open, setOpen] = useState(false)
  const [defaults, setDefaults] = useState<TaskDefaults>({})

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) map.set(t.dueDate, [...(map.get(t.dueDate) ?? []), t])
    return map
  }, [tasks])

  const days = useMemo(() => {
    const year = anchor.getFullYear()
    const month = anchor.getMonth()
    let start: Date
    let count: number
    if (view === 'week') {
      start = startOfWeek(anchor)
      count = 7
    } else {
      const first = new Date(year, month, 1)
      const last = new Date(year, month + 1, 0)
      start = startOfWeek(first)
      count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7
    }
    return Array.from({ length: count }, (_, i) => {
      const date = addDays(start, i)
      return { date, iso: toISODate(date), inMonth: date.getMonth() === month }
    })
  }, [anchor, view])

  const label =
    view === 'month'
      ? anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      : `${days[0].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${days[6].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`

  function step(dir: 1 | -1) {
    setAnchor((a) => (view === 'month' ? new Date(a.getFullYear(), a.getMonth() + dir, 1) : addDays(a, dir * 7)))
  }

  function goToday() {
    setAnchor(new Date())
    setSelected(today)
  }

  function addOn(iso: string) {
    setDefaults({ dueDate: iso })
    setOpen(true)
  }

  const selectedTasks = byDay.get(selected) ?? []
  const upcoming = [...tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6)
  const selectedDate = parseISODate(selected)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        subtitle="Tap a day to see its tasks. Chips open the task."
        actions={
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => addOn(selected)}>
            <Plus size={16} /> Add task
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button type="button" className="icon-btn border border-line" onClick={() => step(-1)} aria-label={view === 'month' ? 'Previous month' : 'Previous week'}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="icon-btn border border-line" onClick={() => step(1)} aria-label={view === 'month' ? 'Next month' : 'Next week'}>
                <ChevronRight size={18} />
              </button>
              <h2 className="ml-2 text-base font-bold sm:text-lg" aria-live="polite">
                {label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={goToday}>
                Today
              </button>
              <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label="Calendar view">
                {(['month', 'week'] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} className={`rounded-[10px] px-3 py-1.5 text-xs font-bold capitalize transition ${view === v ? 'bg-primary text-white' : 'text-muted'}`} onClick={() => setView(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wide text-muted sm:text-xs">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2">
                <span className="sm:hidden">{d[0]}</span>
                <span className="hidden sm:inline">{d}</span>
              </div>
            ))}
          </div>
          <div className="cal-grid">
            {days.map(({ date, iso, inMonth }) => {
              const dayTasks = byDay.get(iso) ?? []
              const isToday = iso === today
              const limit = view === 'week' ? 12 : 3
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  aria-label={`${formatDate(iso)}, ${dayTasks.length} ${dayTasks.length === 1 ? 'task' : 'tasks'}`}
                  aria-pressed={selected === iso}
                  className={`cal-cell ${view === 'month' && !inMonth ? 'muted' : ''} ${selected === iso ? 'selected' : ''} ${view === 'week' ? '!min-h-[150px] sm:!min-h-[240px]' : ''}`}
                  onClick={() => setSelected(iso)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(iso)
                    }
                  }}
                >
                  <span className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${isToday ? 'bg-primary text-white' : ''}`}>{date.getDate()}</span>
                  {dayTasks.slice(0, limit).map((t) => (
                    <Link
                      key={t.id}
                      to={`/app/tasks/${t.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`cal-chip no-underline ${chipTone[t.priority]} ${t.status === 'completed' ? 'line-through opacity-60' : ''}`}
                      title={t.title}
                    >
                      {t.title}
                    </Link>
                  ))}
                  {dayTasks.length > limit ? <span className="cal-chip !cursor-default !bg-transparent text-muted">+{dayTasks.length - limit} more</span> : null}
                  {dayTasks.length ? (
                    <span className="cal-dots" aria-hidden="true">
                      {dayTasks.slice(0, 3).map((t) => (
                        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${dotTone[t.priority]}`} />
                      ))}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Selected day</p>
                <h2 className="mt-1 font-bold">{selectedDate ? selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : selected}</h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addOn(selected)}>
                <Plus size={14} /> Add
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {selectedTasks.length === 0 ? <li className="py-4 text-center text-sm text-muted">No tasks due on this day.</li> : null}
              {selectedTasks.map((t) => (
                <li key={t.id}>
                  <Link to={`/app/tasks/${t.id}`} className="surface-soft flex items-center justify-between gap-2 rounded-xl p-3 text-sm no-underline hover:bg-[var(--tf-hover)]">
                    <span className={`min-w-0 truncate font-semibold ${t.status === 'completed' ? 'text-muted line-through' : ''}`}>{t.title}</span>
                    <PriorityBadge value={t.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold">Upcoming deadlines</h2>
            <ul className="mt-3 space-y-3">
              {upcoming.length === 0 ? <li className="text-sm text-muted">Nothing due. Enjoy the calm.</li> : null}
              {upcoming.map((t) => (
                <li key={t.id} className="text-sm">
                  <Link to={`/app/tasks/${t.id}`} className="block truncate font-semibold no-underline hover:text-primary">
                    {t.title}
                  </Link>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <PriorityBadge value={t.priority} />
                    <DueDate date={t.dueDate} showHint />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <TaskModal open={open} onClose={() => setOpen(false)} defaults={defaults} />
    </div>
  )
}
