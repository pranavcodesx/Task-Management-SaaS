# TaskFlow

Task and project management for students, freelancers, developers and small teams.

**Stack:** React 19, TypeScript, Tailwind CSS 4, Vite, React Router, Recharts, Node/Express (optional server).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build served by Express (with SPA fallback):

```bash
npm start            # builds, then serves on http://localhost:5000
```

Testing on a phone? Run `npm run dev -- --host` and open the printed network URL.

**Demo login:** `pranav@taskflow.dev` / `demo123` (or press "Try the demo workspace").
New accounts you register start with an **empty workspace**; Settings → Data can load sample data.

## What's included

- Public landing page, pricing, login, register, forgot password
- Dashboard (live KPIs, 7-day productivity chart, deadlines, project progress)
- My Tasks: search, filters, sorting, status tabs, create / edit / delete, mobile cards
- Task details: status / priority / assignee, subtasks, comments, attachments (names), activity log
- Projects: create / edit / delete, team members, progress and health calculated from real tasks
- Kanban: drag and drop on desktop, a "Move" button on touch devices, per-column add
- Calendar: month and week views, tap a day to see / add tasks
- Team: invite, edit role and status, remove
- Reports: date range, charts, CSV export, print
- Notifications (created by real actions), profile, settings (theme, compact mode, date format), data export / reset
- Dark mode, mobile bottom navigation, bottom-sheet dialogs, safe-area support

## How data works

Everything is stored in the browser's `localStorage` (one workspace per account). Project progress,
member task counts and the dashboard are **derived from tasks** — nothing is hard-coded.
Passwords for locally registered accounts are hashed, but this is a demo store: a real deployment
needs a backend with proper authentication (see `TODO.md`).

## Project structure

```
src/
  context/AppContext.tsx   state, auth, persistence, all actions
  lib/                     dates, stats (derived numbers), labels
  components/              ui primitives, TaskModal, ProjectModal, confirm dialog, layout/AppShell
  pages/                   one file per screen
  index.css                design tokens, component classes (in @layer components), dark theme
server/index.js            optional Express server (health check + serves dist)
```
