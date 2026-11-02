import type { Member, Project, ProjectHealth, Task } from '../types'
import { todayISO } from './dates'

export function isOpen(t: Task) {
  return t.status !== 'completed'
}

export function isOverdue(t: Task, today = todayISO()) {
  return isOpen(t) && t.dueDate < today
}

/** Project numbers are always derived from real tasks, never stored. */
export function projectStats(project: Project, tasks: Task[]) {
  const list = tasks.filter((t) => t.projectId === project.id)
  const total = list.length
  const done = list.filter((t) => t.status === 'completed').length
  const progress = total ? Math.round((done / total) * 100) : 0
  const overdue = list.filter((t) => isOverdue(t)).length
  let health: ProjectHealth = 'On Track'
  if (total > 0 && done === total) health = 'Completed'
  else if (overdue > 0 || project.deadline < todayISO()) health = 'At Risk'
  return { total, done, progress, overdue, health }
}

export function memberStats(member: Member, tasks: Task[]) {
  const mine = tasks.filter((t) => t.assigneeId === member.id)
  const done = mine.filter((t) => t.status === 'completed').length
  return { assigned: mine.length - done, done, total: mine.length }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

/** Tasks completed per day for the last `days` days (uses completedAt, falls back to due date). */
export function completionsByDay(tasks: Task[], days: number, endISO = todayISO()) {
  const end = new Date(`${endISO}T00:00:00`)
  const out: { key: string; label: string; short: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    out.push({
      key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      short: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: 0,
    })
  }
  for (const t of tasks) {
    if (t.status !== 'completed') continue
    const day = (t.completedAt ?? t.dueDate).slice(0, 10)
    const slot = out.find((o) => o.key === day)
    if (slot) slot.value += 1
  }
  return out
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
