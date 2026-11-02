import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, UserMinus } from 'lucide-react'
import { Avatar, EmptyState, Field, Modal, PageHeader } from '../components/ui'
import { useConfirm } from '../components/confirm'
import { useApp } from '../context/AppContext'
import { memberStats } from '../lib/stats'
import type { Member, MemberStatus, Role } from '../types'

const ROLES: Role[] = ['Admin', 'Project Manager', 'Member']
const STATUS: MemberStatus[] = ['Active', 'Away', 'Invited']

function StatusPill({ value }: { value: MemberStatus }) {
  const tone = value === 'Active' ? 'bg-emerald-50 text-success' : value === 'Away' ? 'bg-amber-50 text-warning' : 'bg-slate-100 text-slate-600'
  return <span className={`badge ${tone}`}>{value}</span>
}

export function Team() {
  const { user, members, tasks, settings, inviteMember, updateMember, removeMember, setToast } = useApp()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [invite, setInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Member' as Role })
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState({ name: '', title: '', role: 'Member' as Role, status: 'Active' as MemberStatus })
  const { confirm, dialog } = useConfirm()

  const filtered = useMemo(
    () =>
      members.filter((m) => {
        if (role !== 'all' && m.role !== role) return false
        if (status !== 'all' && m.status !== status) return false
        if (q && !`${m.name} ${m.email} ${m.title}`.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [members, q, role, status],
  )

  function openEdit(m: Member) {
    setEditing(m)
    setEditForm({ name: m.name, title: m.title, role: m.role, status: m.status })
  }

  function saveEdit() {
    if (!editing || editForm.name.trim().length < 2) return
    updateMember(editing.id, { name: editForm.name.trim(), title: editForm.title.trim(), role: editForm.role, status: editForm.status })
    setToast('Member updated')
    setEditing(null)
  }

  async function remove(m: Member) {
    const count = tasks.filter((t) => t.assigneeId === m.id).length
    const ok = await confirm({
      title: `Remove ${m.name}?`,
      message: count ? `${count} ${count === 1 ? 'task' : 'tasks'} assigned to them will become unassigned.` : 'They will lose access to this workspace.',
      confirmLabel: 'Remove',
    })
    if (!ok) return
    removeMember(m.id)
    setToast(`${m.name} removed`)
    setEditing(null)
  }

  function sendInvite() {
    const err = inviteMember(inviteForm.name, inviteForm.email, inviteForm.role)
    setInviteError(err)
    if (err) return
    setToast(`Invitation sent to ${inviteForm.email}`)
    setInvite(false)
    setInviteForm({ name: '', email: '', role: 'Member' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="People"
        title="Team"
        subtitle={`${members.length} ${members.length === 1 ? 'person' : 'people'} in ${settings.workspace}.`}
        actions={
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => {
              setInviteError(null)
              setInvite(true)
            }}
          >
            <Plus size={16} /> Invite member
          </button>
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="search-box w-full flex-none sm:max-w-xs">
          <Search size={16} className="shrink-0" />
          <input placeholder="Search team members…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search team members" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select className="input sm:w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="input sm:w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All status</option>
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No members found" body="Try a different search or clear a filter." />
      ) : (
        <>
          <div className="card hidden overflow-x-auto md:block">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Open tasks</th>
                  <th>Completed</th>
                  <th>Status</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const s = memberStats(m, tasks)
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar initials={m.avatar} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {m.name} {m.id === user?.id ? <span className="text-xs font-medium text-muted">(you)</span> : null}
                            </p>
                            <p className="truncate text-xs text-muted">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p>{m.role}</p>
                        {m.title && m.title !== m.role ? <p className="text-xs text-muted">{m.title}</p> : null}
                      </td>
                      <td>{s.assigned}</td>
                      <td>{s.done}</td>
                      <td>
                        <StatusPill value={m.status} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-0.5">
                          <button type="button" className="icon-btn" onClick={() => openEdit(m)} aria-label={`Edit ${m.name}`}>
                            <Pencil size={15} />
                          </button>
                          {m.id !== user?.id ? (
                            <button type="button" className="icon-btn hover:!text-danger" onClick={() => void remove(m)} aria-label={`Remove ${m.name}`}>
                              <UserMinus size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((m) => {
              const s = memberStats(m, tasks)
              return (
                <article key={m.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <Avatar initials={m.avatar} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {m.name} {m.id === user?.id ? <span className="text-xs font-medium text-muted">(you)</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted">{m.email}</p>
                      <p className="mt-1 text-xs text-muted">{m.title && m.title !== m.role ? `${m.role} · ${m.title}` : m.role}</p>
                    </div>
                    <StatusPill value={m.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                    <div className="surface-soft rounded-xl py-2">
                      <p className="text-lg font-extrabold">{s.assigned}</p>
                      <p className="text-[11px] text-muted">Open tasks</p>
                    </div>
                    <div className="surface-soft rounded-xl py-2">
                      <p className="text-lg font-extrabold">{s.done}</p>
                      <p className="text-[11px] text-muted">Completed</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn btn-ghost btn-sm flex-1" onClick={() => openEdit(m)}>
                      <Pencil size={14} /> Edit
                    </button>
                    {m.id !== user?.id ? (
                      <button type="button" className="btn btn-danger btn-sm flex-1" onClick={() => void remove(m)}>
                        <UserMinus size={14} /> Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite member"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setInvite(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={sendInvite}>
              Send invite
            </button>
          </>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            sendInvite()
          }}
        >
          <Field label="Full name">
            <input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Email" error={inviteError}>
            <input className="input" type="email" inputMode="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} aria-invalid={Boolean(inviteError)} />
          </Field>
          <Field label="Role">
            <select className="input" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <button type="submit" className="sr-only" tabIndex={-1}>
            Submit
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit member"
        footer={
          <>
            {editing && editing.id !== user?.id ? (
              <button type="button" className="btn btn-danger mr-auto" onClick={() => void remove(editing)}>
                <UserMinus size={15} /> Remove
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveEdit}>
              Save changes
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </Field>
          <Field label="Job title">
            <input className="input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as MemberStatus })}>
                {STATUS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>
      {dialog}
    </div>
  )
}
