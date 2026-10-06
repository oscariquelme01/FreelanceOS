<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FreelanceOS

- This is a deliberately small, single-user, self-hosted personal tool. Its only product domains are Pipeline and Invoices; do not add authentication, teams, RBAC, integrations, generic CRM abstractions, or other SaaS features.
- Build the domains as separate feature slices; share only the application shell, database connection, and genuinely reusable UI primitives. The Invoice slice is currently active; leave the Pipeline placeholder isolated until it is requested.
- Use pnpm (the repository pins pnpm 11). Run focused Vitest tests with `pnpm test`; verify changes with `pnpm verify` (`lint -> typecheck -> test -> build`).
- The target stack is Next.js App Router, strict TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS 4, shadcn/ui-style primitives, Lucide, and Docker Compose.
- Keep Server Components as the default. Add Client Components only around interactions that require browser state or hooks.

## Product constraints

- Keep navigation to Pipeline and Invoices. Do not add an overview dashboard unless explicitly requested.
- Pipeline is a dense table, never a Kanban board. Opportunity details stay on the same page without changing the URL. The opportunity schema needs `source` and a follow-up date in addition to the listed core fields because filtering and follow-up workflows depend on them.
- Pipeline statuses are fixed: Lead, Contacted, Replied, Interviewing, Proposal, Won, Lost, and Ghosted. Do not build configurable pipelines.
- Invoice statuses are fixed: Sent, Paid, and Rejected. New invoices start as Sent; PDFs are regenerated on demand without Google Sheets.
- Clients can be marked inactive; keep them visible for history but exclude them from new-invoice selection.
- The legacy implementation at `../invoice-builder` is reference material for invoice behavior. Its verified rules include six-digit sequential invoice numbers, client defaults for description/currency, optional 21% VAT, optional 15% retainer, and `subtotal + VAT - retainer`. Never read or copy its `.env`, `credentials.json`, or `clients.db`.

## Interface

- Dark mode only. Use the semantic tokens in `app/globals.css`; preserve the warm near-black Vesper palette with restrained mint, peach, status, and destructive colors.
- Follow Linear-like density: compact type and spacing, subtle borders and hover states, few cards, no gradients, and no oversized headings. Tables should look like application interfaces rather than dashboard templates.
- Prefer native HTML behavior, inline actions, keyboard focus states, and small sheets/drawers over large modal forms.
- Invoice-domain create/edit forms open in the shared right-hand sheet without changing the URL; do not reintroduce dedicated form navigation.

## Database and deployment

- Keep schema modules under `db/schema/`, export them from `db/schema/index.ts`, and commit generated migrations under `drizzle/`.
- Keep `DATABASE_URL` server-only. `.env.example` is safe to commit; all real `.env*` files remain ignored.
- `docker compose up -d db` starts local PostgreSQL. Use `pnpm db:generate` after schema changes and `pnpm db:migrate` to apply committed migrations.
