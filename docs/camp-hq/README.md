# Running Camp HQ

Camp HQ is the staff-only camp operations system at `/hq` (spec #140, ADR
0001, "Camp operations" in `GLOSSARY.md`). This page covers running it,
its two database modes, the commands, the test users and the camper file.
`docs/deployment.md` has the deployment details, and
`docs/camp-hq/decisions.md` lists the choices made where the spec was silent.

## Run it locally

1. Put the development Clerk keys in the ignored `frontend/.env.local`:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_test_…`) and `CLERK_SECRET_KEY`
   (`sk_test_…`). `pnpm setup:worktree` copies them into a new worktree.
   Without them the site still runs, and `/hq` says Camp HQ is not available.
2. Start the site: `pnpm dev:worktree` (or `pnpm --dir frontend dev`).
3. Open `/hq` and sign in as a test user (below).

The local database starts with the sample data, so you can try a whole day
at once: the test leader leads the first Camp group (Angels), which has
invented campers this week, a Club day period at 11:30 every weekday and three
Club day options. Signups open at 9:30 and lock at 11:00, camp time (New York).

## Database modes

- **Local** (the default everywhere except on Vercel): a PGlite Postgres in
  the ignored `frontend/.hq-data` folder, one per worktree. It applies the
  migrations and loads the sample data when it opens. Delete the folder to
  start again. PGlite allows one process at a time, so stop the dev server
  before running a Camp HQ command against it.
- **Neon** (the default on Vercel, previews and production): the database in
  `DATABASE_URL`. Migrations never run at request time.
  `CAMP_HQ_DATABASE=neon` in `frontend/.env.local` uses it locally too;
  `CAMP_HQ_DATABASE=local` forces the local one.

The shared Neon dev database is the one previews use. Treat it as shared:
load data into it only with the commands below.

## Commands

Run from the repository root. The Neon commands print the target host and
change nothing until you add `--yes`.

| Command | What it does |
| --- | --- |
| `pnpm --dir frontend hq:db:migrate --yes` | Applies the SQL migrations to the Neon database in `DATABASE_URL_UNPOOLED` (or `DATABASE_URL`). |
| `pnpm --dir frontend hq:db:sample --yes` | Loads the sample data into that Neon database: the sample people (linked to the test users), the Camp groups and activities, this week's invented campers and the sample Club day. Run it after the migrations. Safe to run again; run it in a new week to give previews that week's campers. Dev database only. |
| `pnpm --dir frontend hq:make-admin someone@example.com` | Makes a person an Admin by the email of their Clerk account, in the local database. Add `CAMP_HQ_DATABASE=neon` in front for Neon. Use it for the first Admin; after that Admins manage roles in Camp HQ. |
| `pnpm --dir frontend hq:test-users` | Creates the two Clerk test users when they are missing. |
| `pnpm --dir frontend hq:db:generate` | Writes the next migration after a change to `frontend/lib/hq/db/schema.ts`. Never edit a migration by hand. |
| `pnpm --dir frontend hq:seed-lists` | Rebuilds the committed seed of Camp groups and activities from the Website's published content. Only before Camp HQ has real data. |

To set up the shared dev database for previews:

```sh
pnpm --dir frontend hq:db:migrate --yes
pnpm --dir frontend hq:db:sample --yes
```

## Test users

Two invented users live only in the development Clerk instance. Their emails
contain `+clerk_test`, so they have no password and no real inbox:

| User | Email | Camp HQ |
| --- | --- | --- |
| Sample Admin | `camp-hq-admin+clerk_test@example.com` | Admin |
| Sample Leader | `camp-hq-leader+clerk_test@example.com` | Senior staff, leads Angels |

To sign in by hand (locally or on a preview), enter the email and then the
verification code `424242`, Clerk's fixed code for test emails. The sample
data links the users to their Camp HQ records; their roles live in Camp HQ's
database, not in Clerk.

## Tests

- `pnpm --dir frontend test` runs the Vitest tests. They call the Camp HQ
  operations module the way a page does, against an in-memory PGlite with the
  real migrations.
- `pnpm --dir frontend test:smoke` builds and runs the site and the
  Playwright tests, including `e2e/hq-day.spec.ts`: the leader enters Club day
  picks, the lock passes, and the Admin opens the rosters and finds a child.
  Each run gets a fresh local database, and the server reads a test clock
  (`CAMP_HQ_TEST_CLOCK_FILE`) that starts on Tuesday 6 July 2027 at 10:00 AM
  and moves to 11:35 AM. The clock works only on the local database outside
  Vercel; previews and production always use the real time.

## The camper file

An Admin loads the camper list at `/hq/campers` from a CSV file with one row
per camper per camp day. The first row names the columns, in any order:

| Column | Holds |
| --- | --- |
| `Camper ID` | The camper's id in CampMinder, the same on each of their rows. |
| `Name` | The camper's name as lists show it. |
| `Date` | One camp day, `YYYY-MM-DD`, camp local time. |
| `Camp group` | The Camp group that day, spelled as in Camp HQ. |
| `Expected` | `yes`, or `no` for a planned absence. |

Each load replaces the whole list. `docs/camp-hq/camper-file.md` has the
full rules and says where to change the mapping once Maplewood shares a real
CampMinder export.

## Clearing a past summer

Camp HQ never clears camper data on its own. At the bottom of `/hq/campers`
an Admin picks a date and types `CLEAR`: Camp HQ then removes every camper
day and Club day pick before that date, the campers left with no day, and the
records of loads made before it (they can name children). The newest load
record stays while any camper does. The date cannot be later than today, and
clearing cannot be undone.

## Editable tables

Admin screens edit in the table itself: click a cell, type or pick a value,
and it saves. The shared table is in
`frontend/app/hq/(signed-in)/editable-table/`. A screen passes plain rows and
column definitions whose `save` calls a server action; the action returns a
`CellResult`, and a refusal's reason shows in the cell, which goes back to its
old value. The rules stay in `frontend/lib/hq`.

The Group schedule is the first screen that uses it
(`groups/[id]/schedule/schedule-table.tsx`). The cell types so far are time
and dropdown. To add one (text, multi-pick, checkbox), add a member to
`EditableColumn` in `types.ts` and its cell in `cells.tsx`.
