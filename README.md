# FreelanceOS

FreelanceOS is a personal, self-hosted workspace for managing outbound outreach and invoices. It intentionally stays small: no accounts, teams, permissions, or generic CRM features.

Outreach tracks companies, roles, contacts, statuses, and follow-ups in a dense table. The invoice workspace includes clients, billing details, invoice calculations and PDFs, plus deductible expense uploads.

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
pnpm db:migrate
pnpm db:seed
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

`pnpm db:seed` idempotently adds a fictional billing profile, three clients, 15 invoices, and outreach opportunities covering every workflow status.

## Docker deployment

```bash
docker compose up --build -d
```

Compose waits for PostgreSQL, applies committed migrations through its one-shot `migrate` service, then starts the Next.js standalone image. Put a reverse proxy in front of the application when exposing it publicly and replace the Compose database credentials for deployment.

## Invoice PDFs

Invoice PDFs are rendered directly from snapshotted invoice data and regenerated for every download; there is no Google Sheets dependency. A billing-profile signature can be uploaded as PNG or JPEG. Expense documents and signatures are stored under `STORAGE_PATH` (`./storage` locally and a private Docker volume in Compose); back up that volume together with PostgreSQL.
