import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { PageHeader, ProgressBar } from '../components/ui'
import { addDays, diffDays, toISODate, todayISO } from '../lib/dates'
import { completionsByDay, downloadCSV, isOverdue, projectStats } from '../lib/stats'
import { priorityLabel, statusLabel } from '../lib/labels'

const tooltipStyle = { border: '1px solid #e7ebf3', borderRadius: 12, fontSize: 12, boxShadow: '0 12px 28px rgba(30,55,104,.12)' }

export function Reports() {
  const { tasks, members, projects } = useApp()
  const today = todayISO()
  const [from, setFrom] = useState(() => toISODate(addDays(new Date(), -29)))
  const [to, setTo] = useState(today)

  const inRange = useMemo(() => tasks.filter((t) => t.dueDate >= from && t.dueDate <= to), [tasks, from, to])
  const completed = inRange.filter((t) => t.status === 'completed').length
  const overdue = inRange.filter((t) => isOverdue(t, today)).length
  const pending = inRange.length - completed

  const spanDays = Math.max(1, Math.min(31, diffDays(from, to) + 1))
  const trend = useMemo(() => completionsByDay(tasks, spanDays, to), [tasks, spanDays, to])

  const byPriority = [
    { name: 'High', key: 'high', color: '#EF4444' },
    { name: 'Medium', key: 'medium', color: '#F59E0B' },
    { name: 'Low', key: 'low', color: '#16A34A' },
  ]
    .map((p) => ({ ...p, value: inRange.filter((t) => t.priority === p.key).length }))
    .filter((p) => p.value > 0)

  const byMember = members
    .map((m) => {
      const mine = inRange.filter((t) => t.assigneeId === m.id)
      return { name: m.name.split(' ')[0], done: mine.filter((t) => t.status === 'completed').length, open: mine.filter((t) => t.status !== 'completed').length }
    })
    .filter((m) => m.done + m.open > 0)

  const rangeInvalid = from > to

  function exportCSV() {
    const rows: (string | number)[][] = [['Title', 'Project', 'Assignee', 'Priority', 'Status', 'Start', 'Due', 'Labels']]
    for (const t of inRange) {
      rows.push([
        t.title,
        projects.find((p) => p.id === t.projectId)?.name ?? '',
        members.find((m) => m.id === t.assigneeId)?.name ?? 'Unassigned',
        priorityLabel(t.priority),
        statusLabel(t.status),
        t.startDate,
        t.dueDate,
        t.labels.join('; '),
      ])
    }
    downloadCSV(`taskflow-report-${from}_to_${to}.csv`, rows)
  }

  const empty = (
    <div className="flex h-full items-center justify-center text-sm text-muted">No data in this date range</div>
  )

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Insights" title="Reports & analytics" subtitle="Based on task due dates inside the selected range." />

      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:justify-between sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <label className="block text-xs font-semibold text-muted">
            From
            <input className="input mt-1" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold text-muted">
            To
            <input className="input mt-1" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={exportCSV} disabled={rangeInvalid || inRange.length === 0}>
            <Download size={15} /> Export CSV
          </button>
          <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>
      {rangeInvalid ? <p className="text-sm font-medium text-danger">“From” must be before “To”.</p> : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Tasks in range', inRange.length],
          ['Completed', completed],
          ['Pending', pending],
          ['Overdue', overdue],
        ].map(([l, v]) => (
          <div key={String(l)} className="card p-4 sm:p-5">
            <p className="text-xs font-semibold text-muted sm:text-sm">{l}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <h2 className="font-bold">Completion trend</h2>
          <p className="text-xs text-muted">Tasks completed per day{spanDays === 31 ? ' (last 31 days of range)' : ''}</p>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -22, right: 8, top: 6 }}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" name="Completed" stroke="#2f66f6" strokeWidth={2.5} dot={spanDays <= 14} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-bold">Workload by team member</h2>
          <p className="text-xs text-muted">Open vs completed tasks</p>
          <div className="mt-4 h-60">
            {byMember.length === 0 ? (
              empty
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMember} margin={{ left: -22, right: 8, top: 6 }}>
                  <CartesianGrid stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="open" name="Open" stackId="a" fill="#94A3B8" />
                  <Bar dataKey="done" name="Completed" stackId="a" fill="#2f66f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-bold">Tasks by priority</h2>
          <div className="mt-4 h-60">
            {byPriority.length === 0 ? (
              empty
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byPriority} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} label={({ value }) => value}>
                    {byPriority.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <h2 className="font-bold">Project progress</h2>
          <div className="mt-4 space-y-4">
            {projects.length === 0 ? <p className="text-sm text-muted">No projects yet.</p> : null}
            {projects.map((p) => {
              const s = projectStats(p, tasks)
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-muted">
                      {s.done}/{s.total} · {s.progress}%
                    </span>
                  </div>
                  <ProgressBar value={s.progress} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
