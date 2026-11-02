import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarDays, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { DueDate, EmptyState, PageHeader, PriorityBadge, StatusBadge } from '../components/ui'
import { TaskModal } from '../components/TaskModal'
import { useConfirm } from '../components/confirm'
import { useApp } from '../context/AppContext'
import { PRIORITY_RANK, STATUSES } from '../lib/labels'
import type { Status, Task } from '../types'

type Tab = 'all' | Status
type Sort = 'due' | 'priority' | 'newest' | 'title'

export function Tasks() {
  const { tasks, projects, members, updateTask, deleteTask, setToast } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('all')
  const [priority, setPriority] = useState('all')
  const [project, setProject] = useState('all')
  const [sort, setSort] = useState<Sort>('due')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<Task | null>(null)
  const { confirm, dialog } = useConfirm()
  const q = searchParams.get('search') ?? ''

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'No project'
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? 'Unassigned'

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = tasks.filter((task) => {
      if (tab !== 'all' && task.status !== tab) return false
      if (priority !== 'all' && task.priority !== priority) return false
      if (project !== 'all' && task.projectId !== project) return false
      if (needle) {
        const hay = `${task.title} ${task.description} ${projects.find((p) => p.id === task.projectId)?.name ?? ''} ${task.labels.join(' ')}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    const done = (t: Task) => (t.status === 'completed' ? 1 : 0)
    return [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'priority') return done(a) - done(b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueDate.localeCompare(b.dueDate)
      if (sort === 'newest') return b.startDate.localeCompare(a.startDate)
      return done(a) - done(b) || a.dueDate.localeCompare(b.dueDate)
    })
  }, [tasks, projects, tab, q, priority, project, sort])

  const filtersActive = Boolean(q) || priority !== 'all' || project !== 'all' || tab !== 'all'

  function openEditor(task?: Task) {
    setEdit(task ?? null)
    setOpen(true)
  }

  function setQuery(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
  }

  async function remove(task: Task) {
    if (await confirm({ title: 'Delete this task?', message: `“${task.title}” will be removed permanently.` })) {
      deleteTask(task.id)
      setToast('Task deleted')
    }
  }

  function toggle(task: Task) {
    updateTask(task.id, { status: task.status === 'completed' ? 'todo' : 'completed' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Your work queue"
        title="My tasks"
        subtitle="Stay close to the next step and keep your week moving."
        actions={
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => openEditor()}>
            <Plus size={16} /> Add task
          </button>
        }
      />

      <section className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="search-box w-full flex-none lg:max-w-xs">
            <Search size={16} className="shrink-0" />
            <input placeholder="Search tasks, labels, projects…" value={q} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
            {q ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-muted">
                <X size={15} />
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <select className="input sm:w-auto sm:min-w-[140px]" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select className="input sm:w-auto sm:min-w-[140px]" value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className="input col-span-2 sm:col-span-1 sm:w-auto sm:min-w-[140px]" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort tasks">
              <option value="due">Sort: Due date</option>
              <option value="priority">Sort: Priority</option>
              <option value="newest">Sort: Newest</option>
              <option value="title">Sort: Title A–Z</option>
            </select>
          </div>
        </div>
        <div className="tabs mt-4">
          {[{ id: 'all' as Tab, label: 'All' }, ...STATUSES].map((item) => {
            const count = item.id === 'all' ? tasks.length : tasks.filter((t) => t.status === item.id).length
            return (
              <button key={item.id} type="button" className={`tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
                {item.label} <span className={tab === item.id ? 'text-blue-100' : 'opacity-60'}>({count})</span>
              </button>
            )
          })}
        </div>
        {filtersActive ? (
          <p className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            <span>
              Showing {filtered.length} of {tasks.length} tasks
            </span>
            <button
              type="button"
              className="font-bold text-primary"
              onClick={() => {
                setTab('all')
                setPriority('all')
                setProject('all')
                setQuery('')
              }}
            >
              Clear filters
            </button>
          </p>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? 'No tasks yet' : q ? 'No search results' : 'Nothing matches these filters'}
          body={
            tasks.length === 0
              ? 'Create your first task to start planning your week.'
              : q
                ? `Nothing matched “${q}”. Try a different keyword or clear a filter.`
                : 'Try another status, priority or project.'
          }
          action={
            <button type="button" className="btn btn-primary" onClick={() => openEditor()}>
              <Plus size={16} /> Add task
            </button>
          }
        />
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-12" />
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Assignee</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <input type="checkbox" className="h-4 w-4 accent-[#2f66f6]" checked={task.status === 'completed'} onChange={() => toggle(task)} aria-label={`Mark ${task.title} complete`} />
                    </td>
                    <td>
                      <Link to={`/app/tasks/${task.id}`} className={`font-semibold no-underline hover:text-primary ${task.status === 'completed' ? 'text-muted line-through' : 'text-ink'}`}>
                        {task.title}
                      </Link>
                      {task.description ? <span className="mt-1 block max-w-[260px] truncate text-xs text-muted">{task.description}</span> : null}
                    </td>
                    <td className="text-muted">{projectName(task.projectId)}</td>
                    <td>
                      <PriorityBadge value={task.priority} />
                    </td>
                    <td>
                      <StatusBadge value={task.status} />
                    </td>
                    <td className="whitespace-nowrap">
                      <DueDate date={task.dueDate} done={task.status === 'completed'} />
                    </td>
                    <td className="text-muted">{memberName(task.assigneeId)}</td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <button type="button" className="icon-btn" onClick={() => openEditor(task)} aria-label={`Edit ${task.title}`}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="icon-btn hover:!text-danger" onClick={() => void remove(task)} aria-label={`Delete ${task.title}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((task) => (
              <article key={task.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#2f66f6]" checked={task.status === 'completed'} onChange={() => toggle(task)} aria-label={`Mark ${task.title} complete`} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/tasks/${task.id}`} className={`block text-[15px] font-bold leading-snug no-underline ${task.status === 'completed' ? 'text-muted line-through' : 'text-ink'}`}>
                      {task.title}
                    </Link>
                    {task.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{task.description}</p> : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
                  <PriorityBadge value={task.priority} />
                  <StatusBadge value={task.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 pl-8 text-xs text-muted">
                  <span className="min-w-0 truncate">
                    {projectName(task.projectId)} · {memberName(task.assigneeId)}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <CalendarDays size={13} /> <DueDate date={task.dueDate} done={task.status === 'completed'} />
                  </span>
                </div>
                <div className="mt-3 flex gap-2 pl-8">
                  <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => openEditor(task)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" className="btn btn-danger btn-sm flex-1" onClick={() => void remove(task)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <TaskModal open={open} onClose={() => setOpen(false)} edit={edit} />
      {dialog}
    </div>
  )
}
