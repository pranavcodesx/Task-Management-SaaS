import { useMemo, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightLeft, GripVertical, ListChecks, Plus, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, DueDate, PageHeader, PriorityBadge } from '../components/ui'
import { TaskModal, type TaskDefaults } from '../components/TaskModal'
import { STATUSES } from '../lib/labels'
import type { Status, Task } from '../types'

const dot: Record<Status, string> = {
  todo: 'bg-slate-400',
  'in-progress': 'bg-primary',
  'in-review': 'bg-sky-500',
  completed: 'bg-success',
}

export function Kanban() {
  const { tasks, members, projects, updateTask, setToast } = useApp()
  const [q, setQ] = useState('')
  const [project, setProject] = useState('all')
  const [open, setOpen] = useState(false)
  const [defaults, setDefaults] = useState<TaskDefaults>({})
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Status | null>(null)

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return tasks.filter((t) => {
      if (project !== 'all' && t.projectId !== project) return false
      if (needle && !`${t.title} ${t.labels.join(' ')}`.toLowerCase().includes(needle)) return false
      return true
    })
  }, [tasks, q, project])

  function move(task: Task, status: Status) {
    if (task.status === status) return
    updateTask(task.id, { status })
    setToast(`Moved to ${STATUSES.find((s) => s.id === status)?.label}`)
  }

  function onDrop(status: Status, e: DragEvent) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    const task = tasks.find((t) => t.id === id)
    if (task) move(task, status)
    setDragId(null)
    setOverCol(null)
  }

  function addIn(status: Status) {
    setDefaults({ status, projectId: project !== 'all' ? project : undefined })
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workflow"
        title="Kanban board"
        subtitle="Drag cards between columns, or use the move button on your phone."
        actions={
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => addIn('todo')}>
            <Plus size={16} /> Add task
          </button>
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="search-box w-full flex-none sm:max-w-xs">
          <Search size={16} className="shrink-0" />
          <input placeholder="Search cards…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cards" />
        </div>
        <select className="input sm:w-auto sm:min-w-[180px]" value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="kanban-board">
        {STATUSES.map((col) => {
          const cards = visible.filter((t) => t.status === col.id)
          return (
            <section
              key={col.id}
              className={`kanban-col ${overCol === col.id ? 'drag-over' : ''}`}
              aria-label={col.label}
              onDragOver={(e) => {
                e.preventDefault()
                if (overCol !== col.id) setOverCol(col.id)
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null)
              }}
              onDrop={(e) => onDrop(col.id, e)}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot[col.id]}`} /> {col.label}
                  <span className="badge bg-white text-muted ring-1 ring-[var(--tf-line)]">{cards.length}</span>
                </h2>
                <button type="button" className="icon-btn" onClick={() => addIn(col.id)} aria-label={`Add task to ${col.label}`}>
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-3">
                {cards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-xs text-muted">{q || project !== 'all' ? 'No matching cards' : 'Drop tasks here'}</div>
                ) : null}
                {cards.map((t) => {
                  const m = members.find((x) => x.id === t.assigneeId)
                  const doneSubs = t.subtasks.filter((s) => s.done).length
                  return (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDragId(t.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverCol(null)
                      }}
                      className={`kanban-card md:cursor-grab ${dragId === t.id ? 'dragging' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="mt-0.5 hidden shrink-0 text-slate-300 md:block" />
                        <Link to={`/app/tasks/${t.id}`} className={`min-w-0 flex-1 text-sm font-semibold leading-snug no-underline hover:text-primary ${t.status === 'completed' ? 'text-muted line-through' : 'text-ink'}`}>
                          {t.title}
                        </Link>
                      </div>
                      {t.labels.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.labels.slice(0, 3).map((l) => (
                            <span key={l} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {l}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <PriorityBadge value={t.priority} />
                        <span className="text-[11px]">
                          <DueDate date={t.dueDate} done={t.status === 'completed'} />
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <ListChecks size={13} /> {doneSubs}/{t.subtasks.length}
                        </span>
                        <span className="flex items-center gap-2">
                          <label className="relative inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2 font-semibold text-primary hover:bg-blue-50">
                            <ArrowRightLeft size={13} /> Move
                            <select
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              value={t.status}
                              onChange={(e) => move(t, e.target.value as Status)}
                              aria-label={`Move ${t.title} to another column`}
                            >
                              {STATUSES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {m ? <Avatar initials={m.avatar} size={24} ring={false} /> : null}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      <TaskModal open={open} onClose={() => setOpen(false)} defaults={defaults} />
    </div>
  )
}
