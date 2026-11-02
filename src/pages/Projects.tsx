import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, LayoutGrid, List, Pencil, Plus, Search } from 'lucide-react'
import { Avatar, AvatarStack, DueDate, EmptyState, HealthBadge, PageHeader, PriorityBadge, ProgressBar, StatusBadge } from '../components/ui'
import { TaskModal } from '../components/TaskModal'
import { ProjectModal } from '../components/ProjectModal'
import { useApp } from '../context/AppContext'
import { formatDate, relativeTime } from '../lib/dates'
import { projectStats } from '../lib/stats'

export function Projects() {
  const { projects, members, tasks } = useApp()
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(true)
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => projects.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase())), [projects, q])
  const avatars = (ids: string[]) => ids.map((id) => members.find((m) => m.id === id)?.avatar).filter((a): a is string => Boolean(a))

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        subtitle={`${projects.length} ${projects.length === 1 ? 'project' : 'projects'} in your workspace.`}
        actions={
          <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus size={16} /> Create project
          </button>
        }
      />
      {projects.length > 0 ? (
        <div className="flex gap-2">
          <div className="search-box flex-1 sm:max-w-xs">
            <Search size={16} className="shrink-0" />
            <input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
          </div>
          <div className="flex rounded-xl border border-line p-1" role="group" aria-label="Layout">
            <button type="button" className={`icon-btn !min-h-8 !min-w-9 ${grid ? '!bg-primary !text-white' : ''}`} onClick={() => setGrid(true)} aria-label="Grid view" aria-pressed={grid}>
              <LayoutGrid size={16} />
            </button>
            <button type="button" className={`icon-btn !min-h-8 !min-w-9 ${!grid ? '!bg-primary !text-white' : ''}`} onClick={() => setGrid(false)} aria-label="List view" aria-pressed={!grid}>
              <List size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title={q ? 'No search results' : 'No projects yet'}
          body={q ? `No project matches “${q}”.` : 'Create a project to group related tasks and teammates.'}
          action={
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> Create project
            </button>
          }
        />
      ) : grid ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const s = projectStats(p, tasks)
            return (
              <Link key={p.id} to={`/app/projects/${p.id}`} className="card card-hover block p-5 text-ink no-underline">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words font-bold">{p.name}</h2>
                  <HealthBadge value={s.health} />
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted">{p.description || 'No description'}</p>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>Progress</span>
                  <span className="text-ink">{s.progress}%</span>
                </div>
                <ProgressBar value={s.progress} className="mt-1.5" />
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {s.done}/{s.total} tasks
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} /> Due {formatDate(p.deadline)}
                  </span>
                </div>
                <div className="mt-4">
                  <AvatarStack items={avatars(p.memberIds)} />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {filtered.map((p) => {
            const s = projectStats(p, tasks)
            return (
              <Link key={p.id} to={`/app/projects/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 text-sm text-ink no-underline hover:bg-[var(--tf-soft)]">
                <span className="min-w-0 flex-1 basis-48 font-semibold">{p.name}</span>
                <HealthBadge value={s.health} />
                <span className="flex w-full items-center gap-3 sm:w-48">
                  <ProgressBar value={s.progress} className="flex-1" />
                  <span className="w-9 text-right text-xs font-bold text-muted">{s.progress}%</span>
                </span>
                <span className="text-xs text-muted sm:w-28 sm:text-right">{formatDate(p.deadline)}</span>
              </Link>
            )
          })}
        </div>
      )}
      <ProjectModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, tasks, members } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all')
  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        body="This project may have been deleted."
        action={
          <Link to="/app/projects" className="btn btn-primary">
            All projects
          </Link>
        }
      />
    )
  }

  const s = projectStats(project, tasks)
  const all = tasks.filter((t) => t.projectId === project.id)
  const list = all.filter((t) => (filter === 'all' ? true : filter === 'completed' ? t.status === 'completed' : t.status !== 'completed'))
  const owner = members.find((m) => m.id === project.ownerId)
  const team = project.memberIds.map((mid) => members.find((m) => m.id === mid)).filter((m): m is NonNullable<typeof m> => Boolean(m))
  const memberName = (mid: string) => members.find((m) => m.id === mid)?.name ?? 'Unassigned'
  const recent = all
    .flatMap((t) => t.activity.map((a) => ({ ...a, task: t })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  return (
    <div className="space-y-5">
      <Link to="/app/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted no-underline hover:text-primary">
        <ArrowLeft size={15} /> Projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={project.description || 'No description yet.'}
        actions={
          <>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={() => setEditOpen(true)}>
              <Pencil size={15} /> Edit
            </button>
            <button type="button" className="btn btn-primary flex-1 sm:flex-none" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add task
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Progress</p>
          <p className="mt-1 text-xl font-extrabold">{s.progress}%</p>
          <ProgressBar value={s.progress} className="mt-2" />
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Status</p>
          <p className="mt-2">
            <HealthBadge value={s.health} />
          </p>
          <p className="mt-2 text-xs text-muted">
            {s.done}/{s.total} tasks · {s.overdue} overdue
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Owner</p>
          <p className="mt-1 truncate font-bold">{owner?.name ?? '—'}</p>
          <p className="mt-1 text-xs text-muted">Started {formatDate(project.startDate)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Deadline</p>
          <p className="mt-1 font-bold">{formatDate(project.deadline)}</p>
          <p className="mt-1 text-xs">
            <DueDate date={project.deadline} done={s.health === 'Completed'} showHint />
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <h2 className="font-bold">Tasks ({all.length})</h2>
            <div className="tabs">
              {(['all', 'open', 'completed'] as const).map((f) => (
                <button key={f} type="button" className={`tab capitalize ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              {all.length === 0 ? (
                <>
                  No tasks in this project yet.{' '}
                  <button type="button" className="font-semibold text-primary" onClick={() => setAddOpen(true)}>
                    Add the first one
                  </button>
                </>
              ) : (
                'No tasks in this view.'
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="data-table">
                  <tbody>
                    {list.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <Link to={`/app/tasks/${t.id}`} className={`font-semibold no-underline hover:text-primary ${t.status === 'completed' ? 'text-muted line-through' : ''}`}>
                            {t.title}
                          </Link>
                          <span className="mt-0.5 block text-xs text-muted">{memberName(t.assigneeId)}</span>
                        </td>
                        <td>
                          <PriorityBadge value={t.priority} />
                        </td>
                        <td>
                          <StatusBadge value={t.status} />
                        </td>
                        <td className="whitespace-nowrap text-right text-xs">
                          <DueDate date={t.dueDate} done={t.status === 'completed'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {list.map((t) => (
                  <li key={t.id} className="p-4">
                    <Link to={`/app/tasks/${t.id}`} className={`text-sm font-semibold no-underline ${t.status === 'completed' ? 'text-muted line-through' : 'text-ink'}`}>
                      {t.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PriorityBadge value={t.priority} />
                      <StatusBadge value={t.status} />
                      <span className="ml-auto text-xs">
                        <DueDate date={t.dueDate} done={t.status === 'completed'} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold">Team ({team.length})</h2>
            <ul className="mt-3 space-y-3">
              {team.length === 0 ? <li className="text-sm text-muted">No members yet.</li> : null}
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <Avatar initials={m.avatar} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{m.name}</span>
                    <span className="block truncate text-xs text-muted">{m.title}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold">Recent activity</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {recent.length === 0 ? <li className="text-muted">Nothing yet.</li> : null}
              {recent.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <p className="text-ink/80">{a.text}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {a.task.title} · {relativeTime(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <TaskModal open={addOpen} onClose={() => setAddOpen(false)} defaults={{ projectId: project.id }} />
      <ProjectModal open={editOpen} onClose={() => setEditOpen(false)} edit={project} onDeleted={() => navigate('/app/projects')} />
    </div>
  )
}
