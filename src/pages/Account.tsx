import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, Clock, Download, FolderKanban, LogOut, MessageSquare, Trash2, UserPlus, X } from 'lucide-react'
import { Avatar, EmptyState, Field, PageHeader } from '../components/ui'
import { useConfirm } from '../components/confirm'
import { useApp } from '../context/AppContext'
import { relativeTime } from '../lib/dates'
import type { NotificationItem } from '../types'

const icons = {
  assignment: UserPlus,
  deadline: Clock,
  complete: CheckCircle2,
  project: FolderKanban,
  invite: UserPlus,
  comment: MessageSquare,
}

export function NotificationsPage() {
  const { notifications, markAllRead, markRead, deleteNotification, clearNotifications, setToast } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const { confirm, dialog } = useConfirm()
  const unread = notifications.filter((n) => !n.read).length
  const list = notifications.filter((n) => (tab === 'unread' ? !n.read : true))

  function open(n: NotificationItem) {
    markRead(n.id)
    if (n.link) navigate(n.link)
  }

  async function clearAll() {
    if (await confirm({ title: 'Clear all notifications?', message: 'This removes every notification from the list.', confirmLabel: 'Clear all' })) {
      clearNotifications()
      setToast('Notifications cleared')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You’re all caught up.'}
        actions={
          <>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={markAllRead} disabled={!unread}>
              Mark all read
            </button>
            <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={() => void clearAll()} disabled={!notifications.length}>
              <Trash2 size={15} /> Clear all
            </button>
          </>
        }
      />
      <div className="tabs">
        {(['all', 'unread'] as const).map((t) => (
          <button key={t} type="button" className={`tab capitalize ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t} {t === 'unread' && unread ? `(${unread})` : ''}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="No notifications" body="You’re all caught up. New assignments, comments and reminders will show up here." />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.map((n) => {
            const Icon = icons[n.type]
            return (
              <li key={n.id} className={`flex items-start gap-1 ${n.read ? '' : 'bg-indigo-50/40'}`}>
                <button type="button" className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left" onClick={() => open(n)}>
                  <span className="relative rounded-xl bg-indigo-50 p-2 text-primary">
                    <Icon size={16} />
                    {!n.read ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-[var(--tf-card)]" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                    <span className="mt-1 block text-xs text-muted">{n.createdAt ? relativeTime(n.createdAt) : n.time}</span>
                  </span>
                </button>
                <button type="button" className="icon-btn mr-2 mt-3" onClick={() => deleteNotification(n.id)} aria-label="Dismiss notification">
                  <X size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {dialog}
    </div>
  )
}

export function Profile() {
  const { user, updateUser, logout, setToast } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', title: user?.title ?? '', bio: user?.bio ?? '' })
  const [error, setError] = useState<string | null>(null)
  const dirty = user ? form.name !== user.name || form.email !== user.email || form.title !== user.title || form.bio !== user.bio : false

  function save() {
    const err = updateUser({ name: form.name.trim(), email: form.email, title: form.title.trim(), bio: form.bio.trim() })
    setError(err)
    if (!err) setToast('Profile saved')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader eyebrow="Account" title="Profile" subtitle="How you appear to your teammates." />
      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar initials={user?.avatar ?? '?'} size={68} />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user?.name}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <Field label="Full name">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label="Email" error={error}>
            <input className="input" type="email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={Boolean(error)} autoComplete="email" />
          </Field>
          <Field label="Job title">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Bio">
            <textarea className="input min-h-24" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="btn btn-primary" disabled={!dirty}>
              Save changes
            </button>
            <button
              type="button"
              className="btn btn-ghost sm:ml-auto"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

type SettingsTab = 'General' | 'Notifications' | 'Security' | 'Appearance' | 'Data'

export function SettingsPage() {
  const { settings, updateSettings, changePassword, resetWorkspace, tasks, projects, members, setToast } = useApp()
  const [tab, setTab] = useState<SettingsTab>('General')
  const [pw, setPw] = useState({ current: '', a: '', b: '' })
  const [pwError, setPwError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirm()

  async function submitPassword() {
    if (pw.a !== pw.b) return setPwError('The new passwords don’t match.')
    const err = await changePassword(pw.current, pw.a)
    setPwError(err)
    if (!err) {
      setToast('Password updated')
      setPw({ current: '', a: '', b: '' })
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), projects, members, tasks }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'taskflow-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function reset(kind: 'demo' | 'empty') {
    const ok = await confirm({
      title: kind === 'demo' ? 'Load sample data?' : 'Start with an empty workspace?',
      message: 'Your current tasks and projects will be replaced. This can’t be undone.',
      confirmLabel: kind === 'demo' ? 'Load sample data' : 'Clear workspace',
    })
    if (ok) {
      resetWorkspace(kind)
      setToast(kind === 'demo' ? 'Sample data loaded' : 'Workspace cleared')
    }
  }

  const sections: Record<SettingsTab, ReactNode> = {
    General: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">General</h2>
        <Field label="Workspace name">
          <input className="input" value={settings.workspace} onChange={(e) => updateSettings({ workspace: e.target.value })} />
        </Field>
        <Field label="Date format" hint="Applies to every date in the app.">
          <select className="input" value={settings.dateFormat} onChange={(e) => updateSettings({ dateFormat: e.target.value })}>
            <option>DD MMM YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </Field>
        <p className="text-xs text-muted">Changes are saved automatically.</p>
      </div>
    ),
    Notifications: (
      <div>
        <h2 className="text-lg font-bold">Notifications</h2>
        <div className="mt-2 divide-y divide-line">
          <Toggle label="Email notifications" description="Receive a daily summary by email." checked={settings.emailNotifications} onChange={(v) => updateSettings({ emailNotifications: v })} />
          <Toggle label="Task assignments" description="When a task is assigned to you." checked={settings.taskAssignments} onChange={(v) => updateSettings({ taskAssignments: v })} />
          <Toggle label="Deadline reminders" description="Before a task is due." checked={settings.deadlineReminders} onChange={(v) => updateSettings({ deadlineReminders: v })} />
          <Toggle label="Project updates" description="Progress changes in your projects." checked={settings.projectUpdates} onChange={(v) => updateSettings({ projectUpdates: v })} />
        </div>
        <p className="mt-3 text-xs text-muted">Preferences are stored now; email delivery needs a backend.</p>
      </div>
    ),
    Security: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Security</h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void submitPassword()
          }}
        >
          <Field label="Current password">
            <input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="New password" hint="At least 6 characters.">
            <input className="input" type="password" autoComplete="new-password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} />
          </Field>
          <Field label="Confirm new password" error={pwError}>
            <input className="input" type="password" autoComplete="new-password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} aria-invalid={Boolean(pwError)} />
          </Field>
          <button type="submit" className="btn btn-primary w-full sm:w-auto">
            Update password
          </button>
        </form>
        <div className="divide-y divide-line border-t border-line">
          <Toggle label="Two-factor authentication" description="Preference only in demo mode." checked={settings.twoFactor} onChange={(v) => updateSettings({ twoFactor: v })} />
        </div>
        <div className="surface-soft rounded-xl p-4 text-sm">
          <p className="font-semibold">Active session</p>
          <p className="mt-1 text-muted">This browser · signed in now</p>
        </div>
      </div>
    ),
    Appearance: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Appearance</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateSettings({ theme: t })}
              aria-pressed={settings.theme === t}
              className={`rounded-2xl border-2 p-3 text-left transition ${settings.theme === t ? 'border-primary' : 'border-line hover:border-primary/40'}`}
            >
              <span className={`block h-14 rounded-lg ${t === 'light' ? 'bg-[#f6f8fc] ring-1 ring-slate-200' : 'bg-[#0f1c3a]'}`} />
              <span className="mt-2 block text-sm font-semibold capitalize">{t} theme</span>
            </button>
          ))}
        </div>
        <div className="divide-y divide-line border-t border-line">
          <Toggle label="Compact mode" description="Tighter spacing on tables and cards." checked={settings.compact} onChange={(v) => updateSettings({ compact: v })} />
        </div>
      </div>
    ),
    Data: (
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Your data</h2>
        <p className="text-sm text-muted">Everything is stored in this browser. Export a copy, or reset the workspace.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn btn-ghost" onClick={exportJSON}>
            <Download size={15} /> Export JSON
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void reset('demo')}>
            Load sample data
          </button>
          <button type="button" className="btn btn-danger" onClick={() => void reset('empty')}>
            <Trash2 size={15} /> Clear workspace
          </button>
        </div>
      </div>
    ),
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Preferences" title="Settings" />
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="tabs lg:card lg:h-fit lg:flex-col lg:gap-1 lg:p-2" aria-label="Settings sections">
          {(Object.keys(sections) as SettingsTab[]).map((t) => (
            <button key={t} type="button" className={`tab lg:!bg-transparent lg:text-left lg:!shadow-none ${tab === t ? 'active lg:!bg-blue-50 lg:!text-primary' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
        <div className="card p-4 sm:p-6">{sections[tab]}</div>
      </div>
      {dialog}
    </div>
  )
}

export function EmptyGallery() {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Design reference" title="Empty states" />
      <div className="grid gap-4 md:grid-cols-2">
        <EmptyState title="No tasks" body="You have a clear plate. Add a task to get moving." action={<Link to="/app/tasks" className="btn btn-primary">Go to tasks</Link>} />
        <EmptyState title="No projects" body="Projects help you group work. Create your first one." action={<Link to="/app/projects" className="btn btn-primary">Go to projects</Link>} />
        <EmptyState title="No notifications" body="Nothing new right now. We’ll ping you when there is." />
        <EmptyState title="No search results" body="Try a different keyword or clear filters." />
      </div>
    </div>
  )
}

export function SystemStates() {
  const [mode, setMode] = useState<'404' | 'error' | 'loading' | 'saving' | 'success'>('404')
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Design reference" title="System states" />
      <div className="tabs">
        {(['404', 'error', 'loading', 'saving', 'success'] as const).map((m) => (
          <button key={m} type="button" className={`tab capitalize ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
      </div>
      <div className="card flex min-h-80 flex-col items-center justify-center p-8 text-center sm:p-10">
        {mode === '404' ? (
          <>
            <Bell className="mb-3 text-primary" />
            <h2 className="text-3xl font-bold">404 Not Found</h2>
            <p className="mt-2 text-muted">That page wandered off. Let’s get you back to work.</p>
            <Link to="/app" className="btn btn-primary mt-5">
              Go to dashboard
            </Link>
          </>
        ) : null}
        {mode === 'error' ? (
          <>
            <h2 className="text-3xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-muted">We couldn’t complete that request. Try again in a moment.</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => setMode('loading')}>
              Retry
            </button>
          </>
        ) : null}
        {mode === 'loading' || mode === 'saving' ? (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-primary" />
            <p className="mt-4 font-medium">{mode === 'loading' ? 'Loading dashboard…' : 'Saving task…'}</p>
          </>
        ) : null}
        {mode === 'success' ? (
          <>
            <CheckCircle2 className="text-success" size={40} />
            <h2 className="mt-3 text-2xl font-bold">Task created successfully</h2>
            <p className="mt-2 text-muted">It’s on your board and in My Tasks.</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
