# Personal OS

A deliberately small personal operating system for projects, tasks, nested subtasks, and daily focus.

## Local setup

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to a PostgreSQL database.
2. For task attachments, create a private Vercel Blob store connected to the project, then pull `BLOB_READ_WRITE_TOKEN` with `vercel env pull`.
3. Run `npm install`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed` to load the optional sample workspace.
6. Run `npm run dev` and open `http://localhost:3000`.

## Commands

- `npm run lint` — lint the application.
- `npm run typecheck` — run strict TypeScript checking.
- `npm run build` — produce a production build.
- `npm run db:generate` — generate a new Drizzle migration after schema changes.
- `npm run db:migrate` — apply generated migrations.
- `npm run db:seed` — create sample data when the workspace is empty.
- `npm run db:studio` — inspect the database with Drizzle Studio.

## Architecture

Feature code lives in `src/features/dashboard`, `src/features/projects`, and `src/features/tasks`. Shared UI is in `src/components`, and PostgreSQL/Drizzle code is in `src/db`. Server Actions validate all mutation inputs with Zod and revalidate affected routes.
