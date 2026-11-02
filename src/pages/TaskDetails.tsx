import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, DueDate, EmptyState, PriorityBadge, ProgressBar, StatusBadge } from '../components/ui'
import { TaskModal } from '../components/TaskModal'
import { useConfirm } from '../components/confirm'
import { PRIORITIES, STATUSES } from '../lib/labels'
import { formatDate, relativeTime } from '../lib/dates'
import type { Priority, Status } from '../types'

export function TaskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, tasks, projects, members, updateTask, deleteTask, addComment, deleteComment, addSubtask, deleteSubtask, toggleSubtask, addAttachments, removeAttachment, setToast } = useApp()
  const [edit, setEdit] = useState(false)
  const [comment, setComment] = useState('')
  const [sub, setSub] = useState('')
  const { confirm, dialog } = useConfirm()
  const task = tasks.find((t) => t.id === id)

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        body="This task may have been deleted or the link is wrong."
        action={
          <Link to="/app/tasks" className="btn btn-primary">
            Back to tasks
          </Link>
        }
      />
    )
  }

  const project = projects.find((p) => p.id === task.projectId)
  const assignee = members.find((m) => m.id === task.assigneeId)
  const doneSubs = task.subtasks.filter((s) => s.done).length
  const subPct = task.subtasks.length ? Math.round((doneSubs / task.subtasks.length) * 100) : 0

  async function remove() {
    if (!task) return
    if (!(await confirm({ title: 'Delete this task?', message: `“${task.title}” and its comments will be removed permanently.` }))) return
    deleteTask(task.id)
    setToast('Task deleted')
    navigate('/app/tasks')
  }

  function postComment() {
    if (!task || !comment.trim()) return
    addComment(task.id, comment.trim())
    setComment('')
  }

  function submitSub() {
    if (!task || !sub.trim()) return
    addSubtask(task.id, sub.trim())
    setSub('')
  }

  return (
    <div className="space-y-4">
      <Link to="/app/tasks" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted no-underline hover:text-primary">
        <ArrowLeft size={15} /> My tasks
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card space-y-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {project ? (
                  <Link to={`/app/projects/${project.id}`} className="text-sm font-semibold text-primary no-underline">
                    {project.name}
                  </Link>
                ) : (
                  <p className="text-sm text-muted">No project</p>
                )}
                <h1 className={`mt-1 break-words text-2xl font-extrabold tracking-[-0.03em] ${task.status === 'completed' ? 'text-muted line-through' : ''}`}>{task.title}</h1>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" className="btn btn-secondary flex-1 sm:flex-none" onClick={() => setEdit(true)}>
                  <Pencil size={15} /> Edit
                </button>
                <button type="button" className="btn btn-danger flex-1 sm:flex-none" onClick={() => void remove()}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-semibold text-muted">
                Status
                <select className="input mt-1" value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Status })}>
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">
                Priority
                <select className="input mt-1" value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}>
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">
                Assignee
                <select className="input mt-1" value={task.assigneeId} onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge value={task.status} />
              <PriorityBadge value={task.priority} />
              {task.labels.map((l) => (
                <span key={l} className="badge bg-slate-100 text-slate-600">
                  {l}
                </span>
              ))}
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-muted">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">{task.description || 'No description added yet.'}</p>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Subtasks</h2>
              {task.subtasks.length ? (
                <span className="text-xs font-semibold text-muted">
                  {doneSubs}/{task.subtasks.length} done
                </span>
              ) : null}
            </div>
            {task.subtasks.length ? <ProgressBar value={subPct} className="mt-3" /> : null}
            <ul className="mt-3 space-y-1">
              {task.subtasks.length === 0 ? <li className="py-2 text-sm text-muted">Break this task into smaller steps.</li> : null}
              {task.subtasks.map((s) => (
                <li key={s.id} className="group flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-[var(--tf-hover)]">
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-[#2f66f6] sm:h-4 sm:w-4" checked={s.done} onChange={() => toggleSubtask(task.id, s.id)} aria-label={`Mark ${s.title}`} />
                  <span className={`min-w-0 flex-1 break-words ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
                  <button type="button" className="icon-btn !min-h-8 !min-w-8 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" onClick={() => deleteSubtask(task.id, s.id)} aria-label={`Delete ${s.title}`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input className="input" value={sub} onChange={(e) => setSub(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitSub()} placeholder="Add a subtask…" />
              <button type="button" className="btn btn-secondary shrink-0" onClick={submitSub} aria-label="Add subtask">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <h2 className="font-bold">Comments ({task.comments.length})</h2>
            <ul className="mt-4 space-y-4">
              {task.comments.length === 0 ? <li className="text-sm text-muted">No comments yet. Start the conversation.</li> : null}
              {task.comments.map((c) => {
                const a = members.find((m) => m.id === c.authorId)
                return (
                  <li key={c.id} className="flex gap-3">
                    <Avatar initials={a?.avatar ?? '?'} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                        {a?.name ?? 'Former member'}
                        <span className="text-xs font-normal text-muted">{relativeTime(c.createdAt)}</span>
                        {c.authorId === user?.id ? (
                          <button type="button" className="text-xs font-semibold text-muted hover:text-danger" onClick={() => deleteComment(task.id, c.id)}>
                            Delete
                          </button>
                        ) : null}
                      </p>
                      <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink/80">{c.text}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 flex gap-2">
              <input className="input" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment()} placeholder="Write a comment…" />
              <button type="button" className="btn btn-primary shrink-0" onClick={postComment} disabled={!comment.trim()}>
                Post
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card space-y-4 p-4 text-sm sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Due date</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 font-semibold">
                <CalendarDays size={15} className="text-muted" /> {formatDate(task.dueDate)}
                <span className="text-xs">
                  <DueDate date={task.dueDate} done={task.status === 'completed'} showHint />
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Start date</p>
              <p className="mt-1 font-semibold">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Assignee</p>
              <p className="mt-1 flex items-center gap-2 font-semibold">
                {assignee ? <Avatar initials={assignee.avatar} size={24} /> : null} {assignee?.name ?? 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Attachments
                <label className="inline-flex cursor-pointer items-center gap-1 normal-case tracking-normal text-primary">
                  <Paperclip size={13} /> Add
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map((f) => f.name)
                      if (names.length) addAttachments(task.id, names)
                      e.target.value = ''
                    }}
                  />
                </label>
              </p>
              {task.attachments.length ? (
                <ul className="mt-2 space-y-1.5">
                  {task.attachments.map((a) => (
                    <li key={a} className="surface-soft flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs">
                      <Paperclip size={12} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 truncate">{a}</span>
                      <button type="button" className="text-muted hover:text-danger" onClick={() => removeAttachment(task.id, a)} aria-label={`Remove ${a}`}>
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted">None</p>
              )}
            </div>
          </div>
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold">Activity</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {task.activity.length === 0 ? <li className="text-muted">No activity yet.</li> : null}
              {task.activity.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <p className="text-ink/80">{a.text}</p>
                  <p className="mt-0.5 text-xs text-muted">{relativeTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
      <TaskModal open={edit} onClose={() => setEdit(false)} edit={task} onDeleted={() => navigate('/app/tasks')} />
      {dialog}
    </div>
  )
}
