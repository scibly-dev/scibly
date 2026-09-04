# A worktree owns its ports and its database

Several worktrees are open at once and each one hand-copies the same gitignored
`apps/app/.env`, so every branch runs on ports 3001/4000 against
`localhost:5432/scibly-dev`. That collides three ways: two dev servers cannot
both hold 3001; a migration applied on one branch breaks every other branch's
Prisma client; and `NEXT_PUBLIC_APP_URL` is baked at build time, so a stack
booted on a spare port still emits links to 3001 and quietly walks a reviewer
into another branch's app. `scripts/worktree-up.mjs` (`pnpm wt:up`) therefore derives a stable port block
and a database name from the worktree's directory name, writes that worktree's
five `.env` files, and migrates and seeds its own database.
`scripts/worktree-down.mjs` (`pnpm wt:down`) is the teardown.

Ports alone were the cheaper fix and were rejected: the baked URL forces us to
generate the `.env` anyway, and once that file is being written `DATABASE_URL`
is one more line — while a shared database fails as data corruption, which is
the expensive kind to debug. The script must rewrite `.env` only when its
content actually changes: `.env` is a `globalDependencies` entry in
`turbo.json`, so touching it on every invocation would invalidate the whole
worktree's turbo cache.

Consequence: a database outlives the agent that made it. That is the point —
the stack is left up so a human can open the app and see what a review meant, so
reaping it is a separate, explicit step (`pnpm wt:down`).

It must not outlive the worktree, which is a leak rather than a decision: once
the directory is gone nothing points at the database and nothing will name it
again. `pnpm wt:prune` drops every `scibly_wt_*` database no worktree derives,
and `wt:up` runs the same sweep before provisioning, so at most one generation
survives without anyone having to remember. Liveness comes from `git worktree
list --porcelain`, not from reading the worktrees directory: it is the only
source that sees a worktree added elsewhere, and the only one that distinguishes
a deleted directory (`prunable`) from one that was never there.

The `DATABASE_URL` it copies is checked to point at a local host before any
`CREATE`/`DROP` runs. That check reads the URL only: a local port forwarded to a
remote server passes it, and no amount of parsing would catch that.
