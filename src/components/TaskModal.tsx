import { useState } from 'react'
import { Paperclip, Plus, Trash2, X } from 'lucide-react'
import { Field, Modal } from './ui'
import { useConfirm } from './confirm'
import { useApp } from '../context/AppContext'
import { PRIORITIES, STATUSES } from '../lib/labels'
import { todayISO } from '../lib/dates'
import type { Priority, Status, Subtask, Task } from '../types'

type Form = {
  title: string
  description: string
  projectId: string
  assigneeId: string
  priority: Priority
  status: Status
  startDate: string
  dueDate: string
  labels: string
  subtasks: Subtask[]
  attachments: string[]
}

export type TaskDefaults = Partial<Pick<Form, 'projectId' | 'assigneeId' | 'status' | 'dueDate' | 'priority'>>

type Props = {
  open: boolean
  onClose: () => void
  edit?: Task | null
  defaults?: TaskDefaults
  onDeleted?: () => void
}

/** Mounted only while open, so the form always starts from the right values (no empty first frame). */
export function TaskModal({ open, ...rest }: Props) {
  return open ? <TaskForm key={rest.edit?.id ?? 'new'} {...rest} /> : null
}

function buildForm(edit: Task | null | undefined, d: TaskDefaults, projectIds: string[], memberIds: string[], userId?: string): Form {
  const today = todayISO()
  if (edit) {
    return {
      title: edit.title,
      description: edit.description,
      projectId: edit.projectId,
      assigneeId: edit.assigneeId,
      priority: edit.priority,
      status: edit.status,
      startDate: edit.startDate,
      dueDate: edit.dueDate,
      labels: edit.labels.join(', '),
      subtasks: edit.subtasks,
      attachments: edit.attachments,
    }
  }
  return {
    title: '',
    description: '',
    projectId: d.projectId ?? projectIds[0] ?? '',
    assigneeId: d.assigneeId ?? (userId && memberIds.includes(userId) ? userId : (memberIds[0] ?? '')),
    priority: d.priority ?? 'medium',
    status: d.status ?? 'todo',
    startDate: today,
    dueDate: d.dueDate ?? today,
    labels: '',
    subtasks: [],
    attachments: [],
  }
}

function TaskForm({ onClose, edit, defaults, onDeleted }: Omit<Props, 'open'>) {
  const { user, projects, members, addTask, updateTask, deleteTask, setToast } = useApp()
  const { confirm, dialog } = useConfirm()
  const [form, setForm] = useState<Form>(() =>
    buildForm(edit, defaults ?? {}, projects.map((p) => p.id), members.map((m) => m.id), user?.id),
  )
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({})
  const [newSub, setNewSub] = useState('')

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addSub() {
    const title = newSub.trim()
    if (!title) return
    set('subtasks', [...form.subtasks, { id: `s-${Math.random().toString(36).slice(2, 8)}`, title, done: false }])
    setNewSub('')
  }

  function submit() {
    const f = form
    const next: typeof errors = {}
    if (f.title.trim().length < 2) next.title = 'Give the task a short title.'
    if (f.dueDate && f.startDate && f.dueDate < f.startDate) next.dueDate = 'Due date can’t be before the start date.'
    setErrors(next)
    if (Object.keys(next).length) return
    const data = {
      title: f.title.trim(),
      description: f.description.trim(),
      projectId: f.projectId,
      assigneeId: f.assigneeId,
      priority: f.priority,
      status: f.status,
      startDate: f.startDate,
      dueDate: f.dueDate,
      labels: f.labels.split(',').map((s) => s.trim()).filter(Boolean),
      subtasks: f.subtasks,
      attachments: f.attachments,
    }
    if (edit) updateTask(edit.id, data)
    else addTask(data)
    setToast(edit ? 'Task updated' : 'Task created')
    onClose()
  }

  async function remove() {
    if (!edit) return
    const ok = await confirm({ title: 'Delete this task?', message: `“${edit.title}” and its comments will be removed permanently.` })
    if (!ok) return
    deleteTask(edit.id)
    setToast('Task deleted')
    onClose()
    onDeleted?.()
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={edit ? 'Edit task' : 'Create task'}
        wide
        footer={
          <>
            {edit ? (
              <button type="button" className="btn btn-danger mr-auto" onClick={() => void remove()}>
                <Trash2 size={15} /> Delete
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={submit}>
              {edit ? 'Save changes' : 'Create task'}
            </button>
          </>
        }
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="sm:col-span-2">
            <Field label="Task title" error={errors.title}>
              <input
                className="input"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Design landing page"
                aria-invalid={Boolean(errors.title)}
                autoFocus
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className="input min-h-24" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What needs to be done?" />
            </Field>
          </div>
          <Field label="Project">
            <select className="input" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select className="input" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as Status)}>
              {STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} aria-invalid={Boolean(errors.dueDate)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Labels" hint="Separate with commas">
              <input className="input" value={form.labels} onChange={(e) => set('labels', e.target.value)} placeholder="Design, Backend, QA" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-ink">Subtasks</p>
            {form.subtasks.length ? (
              <ul className="mt-2 space-y-1.5">
                {form.subtasks.map((s) => (
                  <li key={s.id} className="surface-soft flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#2f66f6]"
                      checked={s.done}
                      onChange={() => set('subtasks', form.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
                      aria-label={`Mark ${s.title} done`}
                    />
                    <span className={`min-w-0 flex-1 truncate ${s.done ? 'text-muted line-through' : ''}`}>{s.title}</span>
                    <button type="button" className="icon-btn !min-h-8 !min-w-8" onClick={() => set('subtasks', form.subtasks.filter((x) => x.id !== s.id))} aria-label={`Remove ${s.title}`}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-2 flex gap-2">
              <input
                className="input"
                value={newSub}
                placeholder="Add a subtask and press Enter"
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSub()
                  }
                }}
              />
              <button type="button" className="btn btn-secondary shrink-0" onClick={addSub} aria-label="Add subtask">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-ink">Attachments</p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted transition hover:border-primary hover:text-primary">
              <Paperclip size={16} />
              <span>Add files (only file names are saved in demo mode)</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name)
                  if (names.length) set('attachments', Array.from(new Set([...form.attachments, ...names])))
                  e.target.value = ''
                }}
              />
            </label>
            {form.attachments.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.attachments.map((a) => (
                  <span key={a} className="badge max-w-full bg-slate-100 text-slate-600">
                    <span className="truncate">{a}</span>
                    <button type="button" onClick={() => set('attachments', form.attachments.filter((x) => x !== a))} aria-label={`Remove ${a}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <button type="submit" className="sr-only" tabIndex={-1}>
            Submit
          </button>
        </form>
      </Modal>
      {dialog}
    </>
  )
}
