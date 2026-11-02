import type { Priority, Status } from '../types'

export const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' },
  { id: 'completed', label: 'Completed' },
]

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export function priorityLabel(p: Priority) {
  return PRIORITIES.find((x) => x.id === p)?.label ?? p
}

export function statusLabel(s: Status) {
  return STATUSES.find((x) => x.id === s)?.label ?? s
}

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
