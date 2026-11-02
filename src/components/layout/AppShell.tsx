import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SquareKanban,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Logo } from '../Logo'
import { Avatar } from '../ui'
import { TaskModal } from '../TaskModal'
import { useApp } from '../../context/AppContext'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/kanban', label: 'Kanban Board', icon: SquareKanban },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/team', label: 'Team', icon: Users },
  { to: '/app/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const titles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/tasks': 'My Tasks',
  '/app/projects': 'Projects',
  '/app/kanban': 'Kanban Board',
  '/app/calendar': 'Calendar',
  '/app/team': 'Team',
  '/app/reports': 'Reports & Analytics',
  '/app/notifications': 'Notifications',
  '/app/settings': 'Settings',
  '/app/profile': 'Profile',
  '/app/empty': 'Empty states',
  '/app/system': 'System states',
}

export function AppShell() {
  const { user, logout, notifications, settings } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [openTask, setOpenTask] = useState(false)
  const [sidebar, setSidebar] = useState(false)
  const [query, setQuery] = useState('')
  const unread = notifications.filter((n) => !n.read).length
  const title =
    titles[location.pathname] ??
    (location.pathname.startsWith('/app/projects/') ? 'Project Details' : location.pathname.startsWith('/app/tasks/') ? 'Task Details' : 'TaskFlow')

  // On My Tasks the top search box edits the URL directly, so both search fields always agree.
  const onTasksPage = location.pathname === '/app/tasks'
  const searchValue = onTasksPage ? (searchParams.get('search') ?? '') : query
  function onSearchChange(value: string) {
    if (!onTasksPage) return setQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
  }

  // lock page scroll while the drawer is open, close it on Escape
  useEffect(() => {
    if (!sidebar) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebar(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [sidebar])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = searchValue.trim()
    navigate(value ? `/app/tasks?search=${encodeURIComponent(value)}` : '/app/tasks')
  }

  return (
    <div className={`app-shell flex ${settings.theme === 'dark' ? 'dark' : ''} ${settings.compact ? 'compact' : ''}`}>
      {sidebar ? (
        <button type="button" className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebar(false)} aria-label="Close navigation" />
      ) : null}

      <aside className={`app-sidebar flex flex-col ${sidebar ? 'is-open' : ''}`} aria-label="Sidebar">
        <div className="sidebar-brand flex items-center justify-between px-5">
          <Logo light to="/app" onClick={() => setSidebar(false)} />
          <button type="button" className="icon-btn !text-slate-300 hover:!bg-white/10 lg:hidden" onClick={() => setSidebar(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Workspace</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{settings.workspace}</p>
          </div>
        </div>

        <nav className="sidebar-nav mt-5 flex-1 space-y-1 overflow-y-auto px-4" aria-label="Workspace navigation">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Manage work</p>
          {nav.slice(0, 7).map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebar(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          })}
          <p className="mb-2 mt-6 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          {nav.slice(7).map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setSidebar(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
                {item.to === '/app/notifications' && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4 pb-[calc(1rem+var(--safe-bottom))]">
          <button type="button" className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.07]" onClick={() => {
              setSidebar(false)
              navigate('/app/profile')
            }}>
            <Avatar initials={user?.avatar ?? '?'} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user?.name}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-400">{user?.title}</span>
            </span>
          </button>
          <button
            type="button"
            className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
            onClick={() => {
              setSidebar(false)
              logout()
              navigate('/login', { replace: true })
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="workspace-main flex min-w-0 flex-1 flex-col">
        <header className="workspace-topbar sticky top-0 z-30 flex items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <button type="button" className="icon-btn lg:hidden" onClick={() => setSidebar(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="hidden min-w-[140px] sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">Workspace</p>
            <p className="mt-0.5 text-sm font-bold text-ink">{title}</p>
          </div>
          <form className="search-box" onSubmit={handleSearch} role="search">
            <Search size={16} className="shrink-0" />
            <input aria-label="Search tasks" placeholder="Search tasks…" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} enterKeyHint="search" />
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <button type="button" className="btn btn-primary hidden sm:inline-flex" onClick={() => setOpenTask(true)}>
              <Plus size={16} /> Create task
            </button>
            <button type="button" className="icon-btn relative" onClick={() => navigate('/app/notifications')} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              <Bell size={19} />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-[var(--tf-card)]" /> : null}
            </button>
            <button type="button" className="rounded-full" onClick={() => navigate('/app/profile')} aria-label="Open profile">
              <Avatar initials={user?.avatar ?? '?'} size={36} ring={false} />
            </button>
          </div>
        </header>

        <main className="workspace-content flex-1">
          <Outlet />
        </main>

        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/app/tasks" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ListTodo size={20} />
            <span>Tasks</span>
          </NavLink>
          <button type="button" className="mobile-add" onClick={() => setOpenTask(true)} aria-label="Create task">
            <Plus size={22} />
          </button>
          <NavLink to="/app/kanban" className={({ isActive }) => (isActive ? 'active' : '')}>
            <SquareKanban size={20} />
            <span>Board</span>
          </NavLink>
          <button type="button" onClick={() => setSidebar(true)} aria-label="More">
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </nav>
      </div>
      <TaskModal open={openTask} onClose={() => setOpenTask(false)} />
    </div>
  )
}
