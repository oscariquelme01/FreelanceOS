> [!WARNING] 
> This was vibecoded into oblivion!! Don't judge me on this one :(

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
docker compose -f compose.yaml -f compose.dev.yaml up -d db
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
| `STORAGE_PATH` | Directory for uploaded expense documents and signatures |
| `APP_PORT` | Docker host port for the application (defaults to `3000`; container port stays `3000`) |

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

Create `.env` on the server from `.env.example` if it does not already exist, then set `APP_PORT` to a free host port, for example `APP_PORT=3080`. Docker Compose reads `.env` automatically; `.env.local` is for local Next.js development.

```bash
cp .env.example .env # first setup only; do not overwrite an existing .env
# Edit APP_PORT in .env before starting.
docker compose up --build -d
```

Compose waits for PostgreSQL, applies committed migrations through its one-shot `migrate` service, then starts the Next.js standalone image. PostgreSQL is only accessible inside the Compose network; the development override publishes it on localhost when needed. Compose supplies the container database connection and storage path directly, independently of those values in `.env`.

Point your existing Caddy reverse proxy at the configured host port (for example, `reverse_proxy 127.0.0.1:3080` if Caddy runs on the host). If Caddy runs in a container, use a reachable host address instead of that container's localhost. Keep access restricted to your Tailscale network: the app has no login, and the published app port listens on all host interfaces. No Tailscale Serve or additional reverse proxy is required.

## Invoice PDFs

Invoice PDFs are rendered directly from snapshotted invoice data and regenerated for every download; there is no Google Sheets dependency. A billing-profile signature can be uploaded as PNG or JPEG. Expense documents and signatures are stored under `STORAGE_PATH` (`./storage` locally and a private Docker volume in Compose); back up that volume together with PostgreSQL.
