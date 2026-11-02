# TaskFlow polish plan

## Scope
Continue the existing local React/Vite TaskFlow app in-place. Preserve the current localStorage demo data model and all existing routes, while making the experience feel like a calm, premium task workspace inspired by the supplied TaskFlow reference.

## Implementation approach
- Keep the current React Router structure, context state, seeded demo data, and Recharts usage.
- Refresh the visual system in `src/index.css` with navy navigation, blue primary actions, softer surfaces, consistent radii, focus states, and mobile-safe spacing.
- Upgrade `AppShell` with responsive desktop navigation, mobile bottom navigation, a real global search handoff to My Tasks, quick-create affordances, and clearer workspace identity.
- Redesign Dashboard with the reference composition: greeting header, KPI cards, productivity trend, completion ring, upcoming deadlines, project progress, and an action panel.
- Refine the public landing page and auth shell so marketing, login, and registration share the same product language.
- Improve My Tasks mobile presentation and URL-driven search while preserving desktop table density.
- Add the route manifest required by the app runtime and run typecheck/build validation.

## Design direction
- **Design movement:** iOS-inspired productivity SaaS: quiet surfaces, confident navy chrome, blue focus color, and generous breathing room.
- **Core principles:** scan-first hierarchy; purposeful density; touch-friendly controls; obvious next actions.
- **Color philosophy:** warm near-white canvas and cool slate text keep long sessions comfortable; TaskFlow Blue signals progress and action; navy sidebar provides a stable anchor.
- **Layout paradigm:** a persistent workspace rail with an airy content canvas and asymmetric dashboard panels, rather than a centered marketing grid.
- **Signature elements:** rounded navy sidebar, compact blue status dots, and lightweight progress bars/rings.
- **Interaction philosophy:** every primary action has a clear visual weight; hover/focus feedback is subtle and fast; mobile controls stay within thumb reach.
- **Animation:** short 140–220ms transitions for buttons, cards, nav states, and overlays; no distracting motion.
- **Typography system:** system/Inter-like sans-serif, 12px metadata, 14px body, 16–20px section headings, 30–38px page metrics.
- **Brand essence:** a calm command center for small teams that need to plan, track, and finish work; focused, warm, dependable.
- **Brand voice:** direct and reassuring. Example lines: “A clear view of the work that matters.” and “Turn the next step into momentum.”
- **Wordmark & logo:** rounded square check mark with a small blue-to-indigo gradient, paired with a compact semibold wordmark.
- **Signature brand color:** TaskFlow Blue `#2F66F6`.

## Project structure
- `src/components/layout/AppShell.tsx`: responsive workspace chrome and navigation.
- `src/components/ui.tsx`: shared primitives, badges, modal, fields, and empty states.
- `src/context/AppContext.tsx`: localStorage-backed demo state and actions.
- `src/pages/*.tsx`: public pages and authenticated workspace routes.
- `src/index.css`: shared design tokens, responsive primitives, and utility overrides.
- `public/manus-routes.json`: complete page route declaration for preview/runtime tooling.
