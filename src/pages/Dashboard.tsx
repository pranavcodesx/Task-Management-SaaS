import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FolderKanban, ListTodo, Plus, Sparkles } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '../context/AppContext'
import { DueDate, PageHeader, ProgressBar } from '../components/ui'
import { TaskModal } from '../components/TaskModal'
import { completionsByDay, isOverdue, projectStats } from '../lib/stats'
import { greeting, longToday, todayISO } from '../lib/dates'
import { statusLabel } from '../lib/labels'

const chartTooltip = {
  border: '1px solid #e7ebf3',
  borderRadius: 12,
  boxShadow: '0 12px 28px rgba(30, 55, 104, 0.12)',
  fontSize: 12,
}

export function Dashboard() {
  const { user, tasks, projects } = useApp()
  const [open, setOpen] = useState(false)
  const today = todayISO()

  const week = useMemo(() => completionsByDay(tasks, 7, today), [tasks, today])
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length
  const inReview = tasks.filter((t) => t.status === 'in-review').length
  const overdue = tasks.filter((t) => isOverdue(t, today)).length
  const dueToday = tasks.filter((t) => t.status !== 'completed' && t.dueDate === today).length
  const doneThisWeek = week.reduce((sum, d) => sum + d.value, 0)
  const remaining = Math.max(total - completed, 0)
  const completionRate = total ? Math.round((completed / total) * 100) : 0
  const upcoming = [...tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  const stats = [
    { label: 'Total tasks', value: total, hint: `${remaining} still open`, icon: ListTodo, tone: 'bg-blue-50 text-primary' },
    { label: 'Completed', value: completed, hint: `${doneThisWeek} in the last 7 days`, icon: CheckCircle2, tone: 'bg-emerald-50 text-success' },
    { label: 'In progress', value: inProgress, hint: inReview ? `${inReview} waiting for review` : 'Nothing in review', icon: Clock3, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Overdue', value: overdue, hint: overdue ? 'Needs attention' : dueToday ? `${dueToday} due today` : 'You’re all caught up', icon: AlertCircle, tone: 'bg-rose-50 text-danger' },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={longToday()}
        title={`${greeting()}, ${user?.name.split(' ')[0] ?? 'there'}`}
        subtitle={
          total
            ? `You have ${remaining} open ${remaining === 1 ? 'task' : 'tasks'}${dueToday ? `, ${dueToday} due today` : ''}${overdue ? ` and ${overdue} overdue` : ''}.`
            : 'Your workspace is empty. Create a project and add your first task to get started.'
        }
        actions={
          <>
            <Link to="/app/calendar" className="btn btn-ghost flex-1 sm:flex-none">
              <CalendarDays size={16} /> Calendar
            </Link>
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={() => setOpen(true)}>
              <Plus size={16} /> Add task
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="dashboard-kpi card p-3.5 sm:p-5">
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted sm:text-xs">{stat.label}</p>
                  <p className="dashboard-kpi-value mt-2 text-[28px] font-extrabold leading-none text-ink sm:mt-3 sm:text-[32px]">{stat.value}</p>
                </div>
                <span className={`rounded-xl p-2 sm:p-2.5 ${stat.tone}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className={`relative z-10 mt-3 text-xs ${stat.label === 'Overdue' && overdue ? 'font-semibold text-danger' : 'text-muted'}`}>{stat.hint}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Last 7 days</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Productivity overview</h2>
            </div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-success">{doneThisWeek} done</span>
          </div>
          <div className="mt-5 h-[220px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={week} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="productivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f66f6" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#2f66f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#edf1f7" vertical={false} />
                <XAxis dataKey="short" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8995aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: '#8995aa' }} />
                <Tooltip contentStyle={chartTooltip} cursor={{ stroke: '#cbd9fb', strokeDasharray: '4 4' }} labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''} />
                <Area type="monotone" dataKey="value" name="Tasks completed" stroke="#2f66f6" strokeWidth={3} fill="url(#productivityFill)" dot={{ fill: '#fff', stroke: '#2f66f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-primary" /> Tasks completed per day
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Momentum</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Task completion</h2>
            </div>
            <CheckCircle2 className="text-success" size={20} />
          </div>
          <div className="relative mx-auto mt-4 h-[200px] max-w-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={total ? [{ name: 'Completed', value: completed }, { name: 'Open', value: remaining }] : [{ name: 'Empty', value: 1 }]}
                  dataKey="value"
                  innerRadius={66}
                  outerRadius={86}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={total ? 3 : 0}
                  stroke="none"
                >
                  <Cell fill={total ? '#2f66f6' : '#edf1f7'} />
                  <Cell fill="#edf1f7" />
                </Pie>
                {total ? <Tooltip contentStyle={chartTooltip} /> : null}
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tracking-[-0.06em] text-ink">{completionRate}%</span>
              <span className="mt-1 text-xs font-semibold text-muted">complete</span>
            </div>
          </div>
          <div className="mx-auto grid max-w-[250px] grid-cols-2 gap-3 border-t border-line pt-4 text-center">
            <div>
              <p className="text-lg font-bold text-ink">{completed}</p>
              <p className="text-[11px] text-muted">Finished</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ink">{remaining}</p>
              <p className="text-[11px] text-muted">Remaining</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Stay ahead</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Upcoming deadlines</h2>
            </div>
            <Link to="/app/calendar" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-3 divide-y divide-line">
            {upcoming.length ? (
              upcoming.map((task) => (
                <Link key={task.id} to={`/app/tasks/${task.id}`} className="deadline-row -mx-2 flex items-center gap-3 px-2 py-3 no-underline">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${task.priority === 'high' ? 'bg-danger' : task.priority === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{task.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{statusLabel(task.status)}</span>
                  </span>
                  <span className="shrink-0 text-xs">
                    <DueDate date={task.dueDate} showHint />
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted">No upcoming deadlines. Nice work!</p>
            )}
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Across your workspace</p>
              <h2 className="mt-1 text-lg font-bold text-ink">Project progress</h2>
            </div>
            <Link to="/app/projects" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              All projects <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {projects.length ? (
              projects.slice(0, 4).map((project) => {
                const s = projectStats(project, tasks)
                return (
                  <Link key={project.id} to={`/app/projects/${project.id}`} className="project-row -mx-2 block p-2 no-underline">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-ink">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                          <FolderKanban size={14} />
                        </span>
                        <span className="truncate">{project.name}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-muted">{s.progress}%</span>
                    </div>
                    <ProgressBar value={s.progress} className="mt-2" />
                  </Link>
                )
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted">
                No projects yet.{' '}
                <Link to="/app/projects" className="font-semibold text-primary">
                  Create one
                </Link>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#122653] via-[#1d3f86] to-[#2f66f6] p-5 text-white shadow-[0_16px_34px_rgba(28,69,153,0.2)] sm:p-6">
        <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white/15 p-2.5">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-sm font-bold">Make the next step easy.</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-blue-100">Add a task, move a card, or review your week. Small, visible actions keep the whole team moving.</p>
            </div>
          </div>
          <Link to="/app/kanban" className="btn cta-light w-full sm:w-auto">
            Open board <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      <TaskModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
