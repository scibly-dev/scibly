# A worktree owns its ports and its database

Several worktrees are open at once and each one hand-copies the same gitignored
`apps/app/.env`, so every branch runs on ports 3001/4000 against
`localhost:5432/scibly-dev`. That collides three ways: two dev servers cannot
both hold 3001; a migration applied on one branch breaks every other branch's
Prisma client; and `NEXT_PUBLIC_APP_URL` is baked at build time, so a stack
booted on a spare port still emits links to 3001 and quietly walks a reviewer
into another branch's app. A script therefore derives a stable port pair and a
database name from the worktree name, writes that worktree's `.env`, and
migrates and seeds its own database.

Ports alone were the cheaper fix and were rejected: the baked URL forces us to
generate the `.env` anyway, and once that file is being written `DATABASE_URL`
is one more line — while a shared database fails as data corruption, which is
the expensive kind to debug. The script must rewrite `.env` only when its
content actually changes: `.env` is a `globalDependencies` entry in
`turbo.json`, so touching it on every invocation would invalidate the whole
worktree's turbo cache.

Consequence: databases named `scibly_wt_*` accumulate and outlive their
worktrees. They are kept on purpose so a human can open the app after an agent
has reviewed it; reaping them is a separate, explicit teardown step.
