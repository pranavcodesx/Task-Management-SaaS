import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import { Landing } from './pages/Landing'
import { ForgotPassword, Login, Pricing, Register } from './pages/AuthPages'
import { Dashboard } from './pages/Dashboard'
import { Tasks } from './pages/Tasks'
import { TaskDetails } from './pages/TaskDetails'
import { ProjectDetails, Projects } from './pages/Projects'
import { Kanban } from './pages/Kanban'
import { CalendarPage } from './pages/CalendarPage'
import { Team } from './pages/Team'
import { Reports } from './pages/Reports'
import { EmptyGallery, NotificationsPage, Profile, SettingsPage, SystemStates } from './pages/Account'
import type { ReactNode } from 'react'
import { sessionFlags } from './lib/session'

function Guard({ children }: { children: ReactNode }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={sessionFlags.signedOutOnPurpose ? null : { from: location.pathname + location.search }} />
  return children
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user } = useApp()
  if (user) return <Navigate to="/app" replace />
  return children
}

function ToastHost() {
  const { toast } = useApp()
  if (!toast) return null
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toast}
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()

  // start every page at the top (unless linking to a #section)
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  return (
    <>
      <div key={location.pathname} className="route-transition">
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/app"
          element={
            <Guard>
              <AppShell />
            </Guard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="team" element={<Team />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="empty" element={<EmptyGallery />} />
          <Route path="system" element={<SystemStates />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <ToastHost />
    </>
  )
}

function NotFound() {
  const { user } = useApp()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Error 404</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em]">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted">That page doesn’t exist in TaskFlow. It may have been moved or the link is wrong.</p>
      <Link to={user ? '/app' : '/'} className="btn btn-primary mt-6">
        {user ? 'Go to dashboard' : 'Back home'}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
