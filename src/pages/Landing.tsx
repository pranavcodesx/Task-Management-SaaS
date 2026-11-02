import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight, KanbanSquare, ListChecks, Sparkles, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '../components/Logo'

const features = [
  { icon: ListChecks, title: 'Focused task lists', body: 'Capture priorities, owners, and deadlines in one calm workspace.' },
  { icon: KanbanSquare, title: 'Visual workflows', body: 'Move work from To Do to Done without losing the context behind it.' },
  { icon: Users, title: 'Team alignment', body: 'Assign work, leave useful notes, and keep everyone moving together.' },
  { icon: BarChart3, title: 'Useful insights', body: 'See momentum, overdue work, and project health at a glance.' },
]

const previewTasks = [
  { title: 'Design landing page', meta: 'Website Redesign', status: 'In progress', color: 'bg-blue-50 text-primary' },
  { title: 'API integration', meta: 'API Development', status: 'To do', color: 'bg-amber-50 text-warning' },
  { title: 'Fix mobile responsiveness', meta: 'Mobile App', status: 'In review', color: 'bg-violet-50 text-violet-600' },
]

export function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const location = useLocation()
  const [todayShort] = useState(() => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))
  const [year] = useState(() => new Date().getFullYear())

  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }, [location.hash])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      if (window.scrollY < 180) setActiveSection('home')
    }
    const sections = ['features', 'workflow', 'stories']
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.1, 0.35, 0.6] },
    )
    sections.forEach((id) => {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    })
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="public-shell text-ink">
      <div className="public-navbar-slot">
        <header
          className={`public-navbar border-b border-line/80 bg-white/85 backdrop-blur-xl ${scrolled ? 'is-scrolled' : ''}`}
          style={{
            position: 'fixed',
            top: scrolled ? 14 : 0,
            left: scrolled ? '50%' : 0,
            width: scrolled ? 'min(calc(100% - 32px), 1240px)' : '100%',
            transform: scrolled ? 'translateX(-50%)' : 'none',
            zIndex: 50,
          }}
        >
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Logo />
            <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
              <Link to="/" className={`public-nav-link ${activeSection === 'home' ? 'active' : ''}`}>Home</Link>
              <a href="#features" className={`public-nav-link ${activeSection === 'features' ? 'active' : ''}`}>Features</a>
              <a href="#workflow" className={`public-nav-link ${activeSection === 'workflow' ? 'active' : ''}`}>How it works</a>
              <Link to="/pricing" className="public-nav-link">Pricing</Link>
              <a href="#stories" className={`public-nav-link ${activeSection === 'stories' ? 'active' : ''}`}>Stories</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm sm:min-h-10">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm sm:min-h-10">Start free <ArrowRight size={15} /></Link>
            </div>
          </div>
        </header>
      </div>

      <main>
        <section className="relative isolate px-5 pb-20 pt-14 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="public-glow absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
                <Sparkles size={13} /> Built for momentum, not busywork
              </div>
              <h1 className="mt-6 max-w-xl text-[43px] font-extrabold leading-[1.03] tracking-[-0.065em] text-ink sm:text-6xl lg:text-[68px]">Plan better. Work smarter. Achieve more.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted sm:text-lg">TaskFlow brings tasks, projects, teammates, and deadlines together in one focused workspace — so the next step is always clear.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register" className="btn btn-primary px-5">Get started free <ArrowRight size={16} /></Link>
                <a href="#features" className="btn btn-secondary px-5">Explore features</a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-semibold text-muted">
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> No credit card</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> Setup in 2 minutes</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-success" /> Built for small teams</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[640px] lg:mr-0">
              <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-blue-100/70 blur-3xl" />
              <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl" />
              <div className="hero-preview">
                <div className="hero-preview-window">
                  <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white"><Check size={15} strokeWidth={3} /></span>
                      <span className="text-sm font-bold">TaskFlow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-[10px] font-semibold text-muted sm:block">{todayShort}</span>
                      <span className="h-7 w-7 rounded-full bg-indigo-100" />
                    </div>
                  </div>
                  <div className="grid min-h-[365px] grid-cols-[78px_1fr] sm:grid-cols-[118px_1fr]">
                    <div className="hero-mini-sidebar space-y-2 p-3 sm:p-4">
                      <div className="mb-6 h-2 w-12 rounded-full bg-white/25" />
                      {['Overview', 'My tasks', 'Projects', 'Calendar', 'Reports'].map((item, index) => (
                        <div key={item} className={`rounded-lg px-2 py-2 text-[9px] font-semibold sm:text-[10px] ${index === 0 ? 'bg-primary text-white' : 'text-slate-300'}`}>{item}</div>
                      ))}
                    </div>
                    <div className="bg-[#f8faff] p-3 sm:p-5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">Today at a glance</p>
                          <p className="mt-1 text-base font-extrabold text-ink sm:text-xl">Good morning</p>
                        </div>
                        <span className="hidden rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-primary shadow-sm sm:block">+ Create task</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                        {[['24', 'Total tasks', 'text-primary'], ['12', 'Completed', 'text-success'], ['8', 'In progress', 'text-violet-600'], ['4', 'Overdue', 'text-danger']].map(([value, label, color]) => (
                          <div key={label} className="rounded-xl border border-line bg-white p-3 shadow-sm">
                            <p className={`text-xl font-extrabold ${color}`}>{value}</p>
                            <p className="mt-1 text-[9px] font-semibold text-muted sm:text-[10px]">{label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
                        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
                          <div className="flex items-center justify-between"><p className="text-[10px] font-bold text-ink">Weekly productivity</p><span className="text-[9px] text-success">+14.8%</span></div>
                          <div className="mt-3 flex h-20 items-end gap-1.5 sm:h-24">
                            {[35, 52, 44, 68, 57, 77, 66, 91].map((height, index) => <span key={index} className={`flex-1 rounded-t-md ${index === 7 ? 'bg-primary' : 'bg-blue-100'}`} style={{ height: `${height}%` }} />)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-line bg-white p-3 shadow-sm">
                          <p className="text-[10px] font-bold text-ink">Completion</p>
                          <div className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full border-[9px] border-blue-100 border-t-primary border-r-primary sm:h-24 sm:w-24"><span className="text-lg font-extrabold text-ink">50%</span></div>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-line bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between"><p className="text-[10px] font-bold text-ink">Upcoming deadlines</p><span className="text-[9px] font-semibold text-primary">View all</span></div>
                        <div className="mt-2 space-y-2">
                          {previewTasks.map((task) => <div key={task.title} className="flex items-center gap-2 text-[9px] sm:text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><span className="min-w-0 flex-1 truncate font-semibold text-ink">{task.title}</span><span className={`rounded-md px-1.5 py-1 font-bold ${task.color}`}>{task.status}</span></div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-blue-100 bg-white p-3 shadow-xl sm:block">
                <p className="text-[10px] font-semibold text-muted">This week</p>
                <p className="mt-1 text-lg font-extrabold text-ink">2.4x <span className="text-xs font-semibold text-success">faster delivery</span></p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-line bg-[#f8faff] px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">A better way to move work forward.</h2>
              <p className="mt-3 text-base leading-7 text-muted">TaskFlow gives your team enough structure to stay aligned, without turning every task into a meeting.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return <div key={feature.title} className="card p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary"><Icon size={20} /></span><h3 className="mt-5 text-base font-bold text-ink">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary">Learn more <ChevronRight size={13} /></span></div>
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-5 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Simple by design</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">From idea to done, without the noise.</h2>
              <p className="mt-4 text-base leading-7 text-muted">The best workflow is the one your team will actually use. Start small, keep the view clear, and build momentum every day.</p>
              <Link to="/register" className="btn btn-primary mt-7">Build your workspace <ArrowRight size={15} /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[['01', 'Plan', 'Create projects, break work into clear next steps, and set a finish line.'], ['02', 'Track', 'Use list, board, and calendar views to keep work visible as it moves.'], ['03', 'Achieve', 'Review momentum, remove blockers, and celebrate work that ships.']].map(([number, title, body]) => <div key={number} className="card p-5"><p className="text-xs font-extrabold text-primary">{number}</p><h3 className="mt-8 text-lg font-bold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section id="stories" className="bg-[#f8faff] px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Made for momentum</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">A calmer workspace creates better work.</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[['Priya Sharma', 'Backend Engineer', 'We finally have one place for tasks, docs, and deadlines. The team knows what matters next.'], ['Alex Chen', 'Product Designer', 'The UI is calm. I can scan my week in seconds and spend more time designing.'], ['Rohan Mehta', 'Frontend Engineer', 'Kanban plus reports is exactly what our internship team needed to ship together.']].map(([name, role, quote]) => <blockquote key={name} className="card p-6"><p className="text-sm leading-7 text-slate-600">“{quote}”</p><footer className="mt-6 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-primary">{name.split(' ').map((part) => part[0]).join('')}</span><span><strong className="block text-sm text-ink">{name}</strong><span className="text-xs text-muted">{role}</span></span></footer></blockquote>)}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-gradient-to-br from-[#11234d] to-[#2f66f6] px-6 py-12 text-center text-white shadow-[0_20px_48px_rgba(34,72,156,0.22)] sm:px-12"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Your next step is waiting</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Turn a busy week into a clear plan.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100">Create your workspace, invite your team, and give every important task a home.</p><Link to="/register" className="btn cta-light mt-7">Start free today <ArrowRight size={15} /></Link></div>
        </section>
      </main>

      <footer className="bg-[#0d1b3e] px-5 py-12 text-slate-300 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div><Logo light /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Plan · Track · Achieve. Your productivity, our priority.</p></div>
          {[['Product', ['Features', 'Pricing', 'Kanban', 'Reports']], ['Company', ['About', 'Stories', 'Contact']], ['Legal', ['Privacy', 'Terms', 'Security']]].map(([heading, items]) => <div key={String(heading)}><p className="text-sm font-bold text-white">{heading}</p><ul className="mt-4 space-y-3 text-sm text-slate-400">{(items as string[]).map((item) => { const dest: Record<string, string> = { Features: '/#features', Pricing: '/pricing', Kanban: '/register', Reports: '/register', Stories: '/#stories' }; return <li key={item}>{dest[item] ? <Link to={dest[item]} className="transition hover:text-white">{item}</Link> : <span>{item}</span>}</li> })}</ul></div>)}
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-xs text-slate-500">© {year} TaskFlow. Plan clearly. Ship confidently.</div>
      </footer>
    </div>
  )
}
