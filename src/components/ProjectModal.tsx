import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Field, Modal } from './ui'
import { useConfirm } from './confirm'
import { useApp } from '../context/AppContext'
import { addDays, toISODate } from '../lib/dates'
import type { Project } from '../types'

type Props = { open: boolean; onClose: () => void; edit?: Project | null; onDeleted?: () => void }

/** Mounted only while open, so the form always starts from the right values (no empty first frame). */
export function ProjectModal({ open, ...rest }: Props) {
  return open ? <ProjectForm key={rest.edit?.id ?? 'new'} {...rest} /> : null
}

function ProjectForm({ onClose, edit, onDeleted }: Omit<Props, 'open'>) {
  const { members, tasks, user, addProject, updateProject, deleteProject, setToast } = useApp()
  const { confirm, dialog } = useConfirm()
  const [form, setForm] = useState(() =>
    edit
      ? { name: edit.name, description: edit.description, deadline: edit.deadline, memberIds: edit.memberIds }
      : { name: '', description: '', deadline: toISODate(addDays(new Date(), 30)), memberIds: user ? [user.id] : [] },
  )
  const [errors, setErrors] = useState<{ name?: string; deadline?: string }>({})

  function toggleMember(id: string) {
    setForm((f) => ({ ...f, memberIds: f.memberIds.includes(id) ? f.memberIds.filter((m) => m !== id) : [...f.memberIds, id] }))
  }

  function submit() {
    const next: typeof errors = {}
    if (form.name.trim().length < 2) next.name = 'Give the project a name.'
    if (!form.deadline) next.deadline = 'Pick a deadline.'
    setErrors(next)
    if (Object.keys(next).length) return
    if (edit) {
      // the project owner always stays on the team
      const memberIds = Array.from(new Set([edit.ownerId, ...form.memberIds]))
      updateProject(edit.id, { name: form.name.trim(), description: form.description.trim(), deadline: form.deadline, memberIds })
      setToast('Project updated')
    } else {
      addProject({ name: form.name, description: form.description, deadline: form.deadline, memberIds: form.memberIds })
      setToast('Project created')
    }
    onClose()
  }

  async function remove() {
    if (!edit) return
    const count = tasks.filter((t) => t.projectId === edit.id).length
    const ok = await confirm({
      title: 'Delete this project?',
      message: count ? `“${edit.name}” and its ${count} ${count === 1 ? 'task' : 'tasks'} will be removed permanently.` : `“${edit.name}” will be removed permanently.`,
    })
    if (!ok) return
    deleteProject(edit.id)
    setToast('Project deleted')
    onClose()
    onDeleted?.()
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={edit ? 'Edit project' : 'Create project'}
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
              {edit ? 'Save changes' : 'Create project'}
            </button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Field label="Project name" error={errors.name}>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" aria-invalid={Boolean(errors.name)} autoFocus />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
          </Field>
          <Field label="Deadline" error={errors.deadline}>
            <input className="input" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} aria-invalid={Boolean(errors.deadline)} />
          </Field>
          <div>
            <p className="text-sm font-medium">Team members</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((m) => {
                const on = form.memberIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    aria-pressed={on}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${on ? 'border-primary bg-blue-50 text-primary' : 'border-line text-muted hover:border-primary/40'}`}
                  >
                    {on ? '✓ ' : ''}
                    {m.name}
                  </button>
                )
              })}
            </div>
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
