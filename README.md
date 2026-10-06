# FreelanceOS

FreelanceOS is a personal, self-hosted workspace for tracking freelance opportunities and managing invoices. It intentionally stays small: no accounts, teams, permissions, or generic CRM features.

The application is currently at the shared-foundation stage. Pipeline will be implemented first, followed by invoices and deductible expenses.

## Stack

- Next.js 16 App Router and TypeScript
- PostgreSQL and Drizzle ORM
- Tailwind CSS 4 with shadcn/ui-style primitives
- Docker and Docker Compose

## Local development

Requirements: Node.js 20.9 or newer, pnpm 11, and Docker.

```bash
cp .env.example .env.local
docker compose up -d db
pnpm install
pnpm db:check
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Run `pnpm verify` before handing off changes.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Server-only PostgreSQL connection URL |

Real `.env*` files are ignored. Keep `.env.example` updated with non-secret examples.

## Database migrations

Schema modules live in `db/schema/` and are exported by `db/schema/index.ts`.

```bash
pnpm db:generate  # create a migration after a schema change
pnpm db:migrate   # apply committed migrations
pnpm db:studio    # inspect the local database
```

Generated migrations belong in `drizzle/` and should be committed.

## Docker deployment

```bash
docker compose up --build -d
```

The production image uses Next.js standalone output. Put a reverse proxy in front of the application when exposing it publicly and replace the Compose database credentials for deployment.

## Invoice PDFs

The invoice module is not implemented yet. It will render PDFs directly from persisted invoice data and regenerate them for every download; it will not depend on Google Sheets. Issuer details and a signature asset will be configurable within the application.
