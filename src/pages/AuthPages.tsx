import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useApp } from '../context/AppContext'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
      <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[430px]">
          <Logo />
          <div className="mt-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your focused workspace</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-[34px]">{title}</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-muted">Trusted by small teams who care about clear work.</p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0d1b3e] via-[#17336f] to-[#2f66f6] p-12 text-white lg:flex lg:items-center lg:justify-center">
        <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-blue-300/10" />
        <div className="relative max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Better tasks. Bigger goals.</p>
          <h2 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-[-0.05em]">A calmer view of the work that matters.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">Stay organized, boost productivity, and achieve more with a workspace your team will actually enjoy using.</p>
          <div className="mt-10 overflow-hidden rounded-[22px] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-4 text-ink">
              <div className="flex items-center justify-between"><span className="text-sm font-bold">Today at a glance</span><span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-primary">On track</span></div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['24 tasks', '12 done', '4 due'].map((item, index) => <div key={item} className="rounded-xl bg-[#f7f9fd] p-3"><span className={`text-lg font-extrabold ${index === 1 ? 'text-success' : index === 2 ? 'text-danger' : 'text-primary'}`}>{item.split(' ')[0]}</span><span className="mt-1 block text-[10px] font-semibold text-muted">{item.split(' ').slice(1).join(' ')}</span></div>)}
              </div>
              <div className="mt-3 rounded-xl bg-[#f7f9fd] p-3"><div className="flex items-end justify-between"><span className="text-[10px] font-bold">Weekly productivity</span><span className="text-[10px] font-bold text-success">+14.8%</span></div><div className="mt-4 flex h-20 items-end gap-2">{[35, 52, 44, 68, 57, 77, 66, 91].map((height, index) => <span key={index} className={`flex-1 rounded-t-md ${index === 7 ? 'bg-primary' : 'bg-blue-100'}`} style={{ height: `${height}%` }} />)}</div></div>
            </div>
          </div>
          <p className="mt-8 text-xs font-semibold text-blue-100">Small steps lead to big results.</p>
        </div>
      </div>
    </div>
  )
}

function PasswordInput({ name, placeholder, autoComplete, invalid }: { name: string; placeholder?: string; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative mt-1.5 block">
      <input name={name} type={show ? 'text' : 'password'} required className="input pr-11" placeholder={placeholder} autoComplete={autoComplete} aria-invalid={invalid} />
      <button type="button" className="icon-btn absolute right-1 top-1/2 -translate-y-1/2" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </span>
  )
}

export function Login() {
  const { login, loginDemo } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    const err = await login(String(data.get('email')), String(data.get('password')))
    setBusy(false)
    if (err) setError(err)
    else navigate(from, { replace: true })
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your account to continue.">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
        <label className="block text-sm font-medium">
          Email address
          <input name="email" type="email" inputMode="email" required className="input mt-1.5" placeholder="you@example.com" autoComplete="email" aria-invalid={Boolean(error)} />
        </label>
        <label className="block text-sm font-medium">
          Password
          <PasswordInput name="password" placeholder="Enter your password" autoComplete="current-password" invalid={Boolean(error)} />
        </label>
        <div className="flex justify-end text-sm">
          <Link to="/forgot-password" className="font-medium text-primary">
            Forgot password?
          </Link>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>
        <button
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => {
            loginDemo()
            navigate(from, { replace: true })
          }}
        >
          Try the demo workspace
        </button>
        <p className="text-center text-xs text-muted">
          Demo login: <strong>pranav@taskflow.dev</strong> / <strong>demo123</strong>
        </p>
        <p className="text-center text-sm text-muted">
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useApp()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (String(data.get('password')) !== String(data.get('confirm'))) return setError('Passwords do not match.')
    if (!data.get('terms')) return setError('Please accept the terms to continue.')
    setBusy(true)
    const err = await register(String(data.get('name')), String(data.get('email')), String(data.get('password')))
    setBusy(false)
    if (err) setError(err)
    else navigate('/app', { replace: true })
  }

  return (
    <AuthShell title="Create your account" subtitle="Join TaskFlow and start managing your tasks effortlessly.">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="block text-sm font-medium">
          Full name
          <input name="name" required className="input mt-1.5" placeholder="Enter your name" autoComplete="name" />
        </label>
        <label className="block text-sm font-medium">
          Email address
          <input name="email" type="email" inputMode="email" required className="input mt-1.5" placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <PasswordInput name="password" placeholder="At least 6 characters" autoComplete="new-password" />
        </label>
        <label className="block text-sm font-medium">
          Confirm password
          <PasswordInput name="confirm" autoComplete="new-password" />
        </label>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input name="terms" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#2f66f6]" /> I agree to the Terms and Conditions
        </label>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(String(new FormData(e.currentTarget).get('email')))
  }

  return (
    <AuthShell title="Forgot password" subtitle="Enter your email and we’ll send a reset link.">
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-success" role="status">
          If an account exists for <strong>{sent}</strong>, a reset link is on its way.
          <span className="mt-1 block text-xs opacity-80">Demo mode: no real email is sent because there is no backend yet.</span>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" inputMode="email" required className="input mt-1.5" placeholder="you@example.com" autoComplete="email" />
          </label>
          <button className="btn btn-primary w-full" type="submit">
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <div className="public-shell min-h-screen bg-bg">
      <div className="public-navbar-slot">
        <header className="public-navbar border-b border-line/80 bg-white/85 backdrop-blur-xl" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50 }}>
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
            <Logo />
            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
              <Link to="/" className="public-nav-link">Home</Link>
              <Link to="/#features" className="public-nav-link">Features</Link>
              <Link to="/#workflow" className="public-nav-link">How it works</Link>
              <Link to="/pricing" className="public-nav-link active">Pricing</Link>
              <Link to="/#stories" className="public-nav-link">Stories</Link>
            </nav>
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm sm:min-h-10">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm sm:min-h-10">Get started</Link>
            </div>
          </div>
        </header>
      </div>
      <div className="pricing-page mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="pricing-hero text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Simple, honest pricing</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl tracking-[-0.04em] text-ink">Pricing that grows with you</h1>
          <p className="mt-3 text-muted">Start free. Upgrade when your team is ready.</p>
        </div>
        <div className="mt-7 flex justify-center">
          <button type="button" className="pricing-toggle rounded-full border border-line bg-white p-1 text-sm" onClick={() => setYearly((y) => !y)} aria-label="Toggle monthly or yearly billing">
            <span className={`rounded-full px-3 py-1 ${!yearly ? 'bg-primary text-white' : ''}`}>Monthly</span>
            <span className={`rounded-full px-3 py-1 ${yearly ? 'bg-primary text-white' : ''}`}>Yearly · save 20%</span>
          </button>
        </div>
        <div className="pricing-grid mt-10 grid gap-4 md:grid-cols-3">
          {[
            { name: 'Free', price: 0, items: ['Up to 20 tasks', '1 project', 'Basic calendar'] },
            { name: 'Pro', price: yearly ? 10 : 12, items: ['Unlimited tasks', '10 projects', 'Reports', 'Priority support'], popular: true },
            { name: 'Team', price: yearly ? 23 : 29, items: ['Everything in Pro', 'Unlimited members', 'Admin controls', 'SSO-ready'] },
          ].map((p) => (
            <div key={p.name} className={`pricing-card card flex h-full min-h-[370px] flex-col p-6 ${p.popular ? 'border-primary ring-2 ring-indigo-100' : ''}`}>
              {p.popular ? <div className="text-xs font-semibold text-primary">Most Popular</div> : null}
              <h2 className="mt-1 text-xl font-semibold">{p.name}</h2>
              <p className="mt-3 text-4xl font-bold">
                ${p.price}
                <span className="text-sm text-muted">/mo</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-600">
                {p.items.map((i) => (
                  <li key={i}>✓ {i}</li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-primary mt-auto w-full">
                Get started
              </Link>
            </div>
          ))}
        </div>
        <h3 className="mt-16 text-2xl font-bold">FAQ</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ['Can I switch plans later?', 'Yes. Upgrade or downgrade anytime from Settings.'],
            ['Is there a student discount?', 'The Free plan is built for students. Education teams can contact us.'],
            ['Do you offer yearly billing?', 'Toggle Yearly to save 20% on Pro and Team.'],
            ['Can I cancel anytime?', 'Yes. Your workspace stays readable on Free after canceling paid plans.'],
          ].map(([q, a]) => (
            <div key={q} className="card p-5">
              <h4 className="font-semibold">{q}</h4>
              <p className="mt-1 text-sm text-muted">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
