import { useEffect, useId, type ReactNode } from 'react'
import { Inbox, X } from 'lucide-react'
import type { Priority, ProjectHealth, Status } from '../types'
import { priorityLabel, statusLabel } from '../lib/labels'
import { dueLabel, formatDate } from '../lib/dates'

export function Avatar({ initials, size = 32, ring = true }: { initials: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dce8ff] to-[#b9ceff] font-bold text-primary ${ring ? 'ring-2 ring-white/70' : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export function AvatarStack({ items, size = 28, max = 4 }: { items: string[]; size?: number; max?: number }) {
  const shown = items.slice(0, max)
  const extra = items.length - shown.length
  return (
    <span className="flex -space-x-1.5">
      {shown.map((a, i) => (
        <Avatar key={`${a}-${i}`} initials={a} size={size} />
      ))}
      {extra > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-muted ring-2 ring-white/70"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  )
}

export function PriorityBadge({ value }: { value: Priority }) {
  const map = {
    high: 'bg-red-50 text-danger',
    medium: 'bg-amber-50 text-warning',
    low: 'bg-emerald-50 text-success',
  }
  return <span className={`badge ${map[value]}`}>{priorityLabel(value)}</span>
}

export function StatusBadge({ value }: { value: Status }) {
  const map = {
    todo: 'bg-slate-100 text-slate-600',
    'in-progress': 'bg-indigo-50 text-primary',
    'in-review': 'bg-sky-50 text-sky-700',
    completed: 'bg-emerald-50 text-success',
  }
  return <span className={`badge ${map[value]}`}>{statusLabel(value)}</span>
}

export function HealthBadge({ value }: { value: ProjectHealth }) {
  const map = {
    'On Track': 'bg-emerald-50 text-success',
    'At Risk': 'bg-amber-50 text-warning',
    Completed: 'bg-indigo-50 text-primary',
  }
  return <span className={`badge ${map[value]}`}>{value}</span>
}

/** Due date that turns red when overdue. */
export function DueDate({ date, done, showHint = false }: { date: string; done?: boolean; showHint?: boolean }) {
  const label = dueLabel(date, done)
  const cls = label.tone === 'overdue' ? 'font-semibold text-danger' : label.tone === 'soon' ? 'font-semibold text-warning' : 'text-muted'
  return (
    <span className={cls} title={showHint ? undefined : label.text}>
      {showHint ? label.text : formatDate(date)}
    </span>
  )
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`progress-track ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-value" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="page-heading flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold text-ink sm:text-[30px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
    </section>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <div className={`modal-panel ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h2 id={titleId} className="text-lg font-bold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
        <Inbox size={24} />
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function Field({ label, children, error, hint }: { label: string; children: ReactNode; error?: string | null; hint?: string }) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint && !error ? <p className="mt-1 text-xs font-normal text-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  )
}
