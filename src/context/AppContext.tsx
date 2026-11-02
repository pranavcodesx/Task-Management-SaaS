import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  currentUser as seedUser,
  defaultSettings,
  members as seedMembers,
  notifications as seedNotes,
  projects as seedProjects,
  tasks as seedTasks,
} from '../data/seed'
import { setDatePreference } from '../lib/dates'
import { sessionFlags } from '../lib/session'
import { statusLabel } from '../lib/labels'
import { initials } from '../lib/stats'
import type { Member, NotificationItem, Project, SettingsState, Task, User } from '../types'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Workspace = {
  members: Member[]
  projects: Project[]
  tasks: Task[]
  notifications: NotificationItem[]
  settings: SettingsState
}

type Account = { email: string; hash: string; user: User }

export type TaskInput = Omit<Task, 'id' | 'comments' | 'activity' | 'subtasks' | 'attachments' | 'completedAt'> &
  Partial<Pick<Task, 'subtasks' | 'attachments'>>

export type ProjectInput = { name: string; description: string; deadline: string; memberIds?: string[] }

type AppContextValue = {
  user: User | null
  members: Member[]
  projects: Project[]
  tasks: Task[]
  notifications: NotificationItem[]
  settings: SettingsState
  toast: string | null
  setToast: (msg: string | null) => void

  login: (email: string, password: string) => Promise<string | null>
  loginDemo: () => void
  register: (name: string, email: string, password: string) => Promise<string | null>
  logout: () => void
  updateUser: (patch: Partial<User>) => string | null
  changePassword: (current: string, next: string) => Promise<string | null>
  resetWorkspace: (kind: 'demo' | 'empty') => void

  addTask: (task: TaskInput) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  addSubtask: (taskId: string, title: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addComment: (taskId: string, text: string) => void
  deleteComment: (taskId: string, commentId: string) => void
  addAttachments: (taskId: string, names: string[]) => void
  removeAttachment: (taskId: string, name: string) => void

  addProject: (input: ProjectInput) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void

  inviteMember: (name: string, email: string, role: Member['role']) => string | null
  updateMember: (id: string, patch: Partial<Member>) => void
  removeMember: (id: string) => void

  markAllRead: () => void
  markRead: (id: string) => void
  deleteNotification: (id: string) => void
  clearNotifications: () => void

  updateSettings: (patch: Partial<SettingsState>) => void
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export const DEMO_EMAIL = 'pranav@taskflow.dev'
export const DEMO_PASSWORD = 'demo123'

const SESSION_KEY = 'taskflow-session-v2'
const ACCOUNTS_KEY = 'taskflow-accounts-v2'
const WS_PREFIX = 'taskflow-ws-v2:'
const LEGACY_KEY = 'taskflow-state-v1'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — the app keeps working in memory */
  }
}

function demoWorkspace(): Workspace {
  let n = 0
  const offsets = [0, 1, 1, 2, 4, 5]
  return {
    members: seedMembers,
    projects: seedProjects,
    tasks: seedTasks.map((t) =>
      t.status === 'completed' && !t.completedAt
        ? { ...t, completedAt: new Date(Date.now() - (offsets[n++ % offsets.length] * 86_400_000 + 3_600_000)).toISOString() }
        : t,
    ),
    notifications: seedNotes,
    settings: defaultSettings,
  }
}

function emptyWorkspace(user: User): Workspace {
  return {
    members: [{ ...user, role: 'Admin', status: 'Active' }],
    projects: [],
    tasks: [],
    notifications: [
      {
        id: uid('n'),
        type: 'project',
        title: 'Welcome to TaskFlow',
        body: 'Create your first project, then add tasks to it.',
        time: 'Just now',
        createdAt: new Date().toISOString(),
        link: '/app/projects',
        read: false,
      },
    ],
    settings: defaultSettings,
  }
}

function loadWorkspace(user: User): Workspace {
  const saved = readJSON<Partial<Workspace>>(WS_PREFIX + user.id)
  if (saved) {
    const base = user.id === seedUser.id ? demoWorkspace() : emptyWorkspace(user)
    return {
      members: saved.members ?? base.members,
      projects: saved.projects ?? base.projects,
      tasks: saved.tasks ?? base.tasks,
      notifications: saved.notifications ?? base.notifications,
      settings: { ...defaultSettings, ...(saved.settings ?? {}) },
    }
  }
  return user.id === seedUser.id ? demoWorkspace() : emptyWorkspace(user)
}

/** Restores the session synchronously so there is no logged-out flash on reload. */
function bootstrap(): { user: User | null; ws: Workspace } {
  const session = readJSON<{ user?: User }>(SESSION_KEY)
  if (session?.user) return { user: session.user, ws: loadWorkspace(session.user) }

  // Migrate data saved by the first version of the app.
  const legacy = readJSON<{ auth?: { user?: User | null } } & Partial<Workspace>>(LEGACY_KEY)
  if (legacy?.auth?.user) {
    const user = legacy.auth.user
    const ws: Workspace = {
      members: legacy.members ?? seedMembers,
      projects: legacy.projects ?? seedProjects,
      tasks: legacy.tasks ?? seedTasks,
      notifications: legacy.notifications ?? seedNotes,
      settings: { ...defaultSettings, ...(legacy.settings ?? {}) },
    }
    writeJSON(WS_PREFIX + user.id, ws)
    writeJSON(SESSION_KEY, { user })
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      /* ignore */
    }
    return { user, ws }
  }
  return { user: null, ws: demoWorkspace() }
}

async function hashPassword(value: string): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(`taskflow:${value}`))
      return 's:' + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    /* fall through */
  }
  // crypto.subtle is unavailable on plain-http LAN addresses (e.g. testing on a phone).
  let h = 0x811c9dc5
  for (const ch of `taskflow:${value}`) {
    h ^= ch.codePointAt(0) ?? 0
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return 'f:' + h.toString(16)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(bootstrap)
  const [user, setUser] = useState<User | null>(boot.user)
  const [ws, setWs] = useState<Workspace>(boot.ws)
  const [toast, setToast] = useState<string | null>(null)
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Date format is read by plain helper functions, so keep it in sync during render.
  setDatePreference(ws.settings.dateFormat)

  useEffect(() => {
    if (!user) return
    writeJSON(SESSION_KEY, { user })
    writeJSON(WS_PREFIX + user.id, ws)
  }, [user, ws])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const value = useMemo<AppContextValue>(() => {
    const actor = () => userRef.current?.name ?? 'You'
    const patchWs = (fn: (w: Workspace) => Workspace) => setWs((w) => fn(w))
    const notify = (w: Workspace, n: Omit<NotificationItem, 'id' | 'time' | 'createdAt' | 'read'>): Workspace => ({
      ...w,
      notifications: [
        { ...n, id: uid('n'), time: 'Just now', createdAt: new Date().toISOString(), read: false },
        ...w.notifications,
      ].slice(0, 60),
    })
    const log = (text: string) => ({ id: uid('a'), text, createdAt: new Date().toISOString() })
    const nameOf = (w: Workspace, id: string) => w.members.find((m) => m.id === id)?.name ?? 'Unassigned'
    const mapTask = (w: Workspace, id: string, fn: (t: Task) => Task): Workspace => ({
      ...w,
      tasks: w.tasks.map((t) => (t.id === id ? fn(t) : t)),
    })

    const startSession = (next: User) => {
      sessionFlags.signedOutOnPurpose = false
      writeJSON(SESSION_KEY, { user: next })
      setUser(next)
      setWs(loadWorkspace(next))
    }

    return {
      user,
      members: ws.members,
      projects: ws.projects,
      tasks: ws.tasks,
      notifications: ws.notifications,
      settings: ws.settings,
      toast,
      setToast,

      /* ---------- auth ---------- */
      login: async (rawEmail, password) => {
        const email = rawEmail.trim().toLowerCase()
        if (!EMAIL_RE.test(email)) return 'Enter a valid email address.'
        if (!password) return 'Enter your password.'
        if (email === DEMO_EMAIL) {
          if (password !== DEMO_PASSWORD) return 'Incorrect email or password.'
          startSession(seedUser)
          return null
        }
        const accounts = readJSON<Account[]>(ACCOUNTS_KEY) ?? []
        const account = accounts.find((a) => a.email === email)
        if (!account || account.hash !== (await hashPassword(password))) return 'Incorrect email or password.'
        startSession(account.user)
        return null
      },
      loginDemo: () => startSession(seedUser),
      register: async (name, rawEmail, password) => {
        const email = rawEmail.trim().toLowerCase()
        if (name.trim().length < 2) return 'Please enter your full name.'
        if (!EMAIL_RE.test(email)) return 'Enter a valid email address.'
        if (password.length < 6) return 'Password must be at least 6 characters.'
        const accounts = readJSON<Account[]>(ACCOUNTS_KEY) ?? []
        if (email === DEMO_EMAIL || accounts.some((a) => a.email === email)) return 'An account with this email already exists.'
        const next: User = {
          id: uid('u'),
          name: name.trim(),
          email,
          title: 'Team member',
          bio: '',
          avatar: initials(name),
        }
        writeJSON(ACCOUNTS_KEY, [...accounts, { email, hash: await hashPassword(password), user: next }])
        startSession(next)
        return null
      },
      logout: () => {
        sessionFlags.signedOutOnPurpose = true
        try {
          localStorage.removeItem(SESSION_KEY)
        } catch {
          /* ignore */
        }
        setUser(null)
      },
      updateUser: (patch) => {
        const current = userRef.current
        if (!current) return 'Not signed in.'
        if (patch.name !== undefined && patch.name.trim().length < 2) return 'Name is too short.'
        if (patch.email !== undefined && !EMAIL_RE.test(patch.email.trim())) return 'Enter a valid email address.'
        const next: User = { ...current, ...patch }
        if (patch.name !== undefined) next.avatar = initials(patch.name)
        if (patch.email !== undefined) next.email = patch.email.trim().toLowerCase()
        setUser(next)
        patchWs((w) => ({ ...w, members: w.members.map((m) => (m.id === next.id ? { ...m, ...next } : m)) }))
        const accounts = readJSON<Account[]>(ACCOUNTS_KEY)
        if (accounts) {
          writeJSON(
            ACCOUNTS_KEY,
            accounts.map((a) => (a.user.id === next.id ? { ...a, email: next.email, user: next } : a)),
          )
        }
        return null
      },
      changePassword: async (current, next) => {
        const u = userRef.current
        if (!u) return 'Not signed in.'
        if (u.email === DEMO_EMAIL) return 'The demo account’s password can’t be changed. Create your own account to try this.'
        if (next.length < 6) return 'New password must be at least 6 characters.'
        const accounts = readJSON<Account[]>(ACCOUNTS_KEY) ?? []
        const account = accounts.find((a) => a.user.id === u.id)
        if (!account || account.hash !== (await hashPassword(current))) return 'Current password is incorrect.'
        const hash = await hashPassword(next)
        writeJSON(ACCOUNTS_KEY, accounts.map((a) => (a.user.id === u.id ? { ...a, hash } : a)))
        return null
      },
      resetWorkspace: (kind) => {
        const current = userRef.current
        if (!current) return
        setWs(kind === 'demo' ? demoWorkspace() : emptyWorkspace(current))
      },

      /* ---------- tasks ---------- */
      addTask: (input) => {
        const task: Task = {
          comments: [],
          subtasks: input.subtasks ?? [],
          attachments: input.attachments ?? [],
          ...input,
          id: uid('t'),
          activity: [log(`Task created by ${actor()}`)],
          completedAt: input.status === 'completed' ? new Date().toISOString() : undefined,
        }
        patchWs((w) =>
          notify(
            { ...w, tasks: [task, ...w.tasks] },
            {
              type: 'assignment',
              title: 'Task created',
              body: `${task.title} · assigned to ${nameOf(w, task.assigneeId)}`,
              link: `/app/tasks/${task.id}`,
            },
          ),
        )
        return task
      },
      updateTask: (id, patch) =>
        patchWs((w) => {
          const old = w.tasks.find((t) => t.id === id)
          if (!old) return w
          const entries: Task['activity'] = []
          let next: Task = { ...old, ...patch }
          if (patch.status && patch.status !== old.status) {
            entries.push(log(`${actor()} moved this task to ${statusLabel(patch.status)}`))
            next = { ...next, completedAt: patch.status === 'completed' ? new Date().toISOString() : undefined }
          }
          if (patch.priority && patch.priority !== old.priority) entries.push(log(`${actor()} changed priority to ${patch.priority}`))
          if (patch.assigneeId !== undefined && patch.assigneeId !== old.assigneeId) {
            entries.push(log(`${actor()} reassigned this task to ${nameOf(w, patch.assigneeId)}`))
          }
          if (patch.dueDate && patch.dueDate !== old.dueDate) entries.push(log(`${actor()} changed the due date to ${patch.dueDate}`))
          if (entries.length) next = { ...next, activity: [...entries, ...old.activity] }
          let out: Workspace = { ...w, tasks: w.tasks.map((t) => (t.id === id ? next : t)) }
          if (patch.status === 'completed' && old.status !== 'completed') {
            out = notify(out, { type: 'complete', title: 'Task completed', body: `${next.title} was marked as completed.`, link: `/app/tasks/${id}` })
          }
          return out
        }),
      deleteTask: (id) => patchWs((w) => ({ ...w, tasks: w.tasks.filter((t) => t.id !== id) })),
      addSubtask: (taskId, title) =>
        patchWs((w) => mapTask(w, taskId, (t) => ({ ...t, subtasks: [...t.subtasks, { id: uid('s'), title, done: false }] }))),
      deleteSubtask: (taskId, subtaskId) =>
        patchWs((w) => mapTask(w, taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }))),
      toggleSubtask: (taskId, subtaskId) =>
        patchWs((w) =>
          mapTask(w, taskId, (t) => ({
            ...t,
            subtasks: t.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
          })),
        ),
      addComment: (taskId, text) => {
        const author = userRef.current
        if (!author) return
        patchWs((w) =>
          notify(
            mapTask(w, taskId, (t) => ({
              ...t,
              comments: [...t.comments, { id: uid('c'), authorId: author.id, text, createdAt: new Date().toISOString() }],
            })),
            { type: 'comment', title: 'New comment', body: `You commented on ${w.tasks.find((t) => t.id === taskId)?.title ?? 'a task'}.`, link: `/app/tasks/${taskId}` },
          ),
        )
      },
      deleteComment: (taskId, commentId) =>
        patchWs((w) => mapTask(w, taskId, (t) => ({ ...t, comments: t.comments.filter((c) => c.id !== commentId) }))),
      addAttachments: (taskId, names) =>
        patchWs((w) => mapTask(w, taskId, (t) => ({ ...t, attachments: Array.from(new Set([...t.attachments, ...names])) }))),
      removeAttachment: (taskId, name) =>
        patchWs((w) => mapTask(w, taskId, (t) => ({ ...t, attachments: t.attachments.filter((a) => a !== name) }))),

      /* ---------- projects ---------- */
      addProject: (input) => {
        const owner = userRef.current?.id ?? 'u1'
        const project: Project = {
          id: uid('p'),
          name: input.name.trim(),
          description: input.description.trim(),
          deadline: input.deadline,
          startDate: new Date().toISOString().slice(0, 10),
          ownerId: owner,
          memberIds: Array.from(new Set([owner, ...(input.memberIds ?? [])])),
        }
        patchWs((w) =>
          notify({ ...w, projects: [project, ...w.projects] }, { type: 'project', title: 'Project created', body: `${project.name} is ready for tasks.`, link: `/app/projects/${project.id}` }),
        )
        return project
      },
      updateProject: (id, patch) => patchWs((w) => ({ ...w, projects: w.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProject: (id) =>
        patchWs((w) => ({ ...w, projects: w.projects.filter((p) => p.id !== id), tasks: w.tasks.filter((t) => t.projectId !== id) })),

      /* ---------- team ---------- */
      inviteMember: (name, rawEmail, role) => {
        const email = rawEmail.trim().toLowerCase()
        if (name.trim().length < 2) return 'Please enter the full name.'
        if (!EMAIL_RE.test(email)) return 'Enter a valid email address.'
        if (ws.members.some((m) => m.email.toLowerCase() === email)) return 'This person is already in your workspace.'
        patchWs((w) =>
          notify(
            {
              ...w,
              members: [
                ...w.members,
                { id: uid('u'), name: name.trim(), email, title: role, bio: '', avatar: initials(name), role, status: 'Invited' },
              ],
            },
            { type: 'invite', title: 'Team invitation', body: `${name.trim()} was invited as ${role}.`, link: '/app/team' },
          ),
        )
        return null
      },
      updateMember: (id, patch) => {
        const next = patch.name ? { ...patch, avatar: initials(patch.name) } : patch
        patchWs((w) => ({ ...w, members: w.members.map((m) => (m.id === id ? { ...m, ...next } : m)) }))
      },
      removeMember: (id) =>
        patchWs((w) => ({
          ...w,
          members: w.members.filter((m) => m.id !== id),
          tasks: w.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: '' } : t)),
          projects: w.projects.map((p) => ({ ...p, memberIds: p.memberIds.filter((m) => m !== id) })),
        })),

      /* ---------- notifications / settings ---------- */
      markAllRead: () => patchWs((w) => ({ ...w, notifications: w.notifications.map((n) => ({ ...n, read: true })) })),
      markRead: (id) => patchWs((w) => ({ ...w, notifications: w.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      deleteNotification: (id) => patchWs((w) => ({ ...w, notifications: w.notifications.filter((n) => n.id !== id) })),
      clearNotifications: () => patchWs((w) => ({ ...w, notifications: [] })),
      updateSettings: (patch) => patchWs((w) => ({ ...w, settings: { ...w.settings, ...patch } })),
    }
  }, [user, ws, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
