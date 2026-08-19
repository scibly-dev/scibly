## Next.js

Version-matched docs ship inside the package: read `apps/app/node_modules/next/dist/docs/` before writing Next.js code, not your training data. The repo root has no `next` install, so the path must go through an app. Same block lives in [apps/app/AGENTS.md](apps/app/AGENTS.md) and [apps/web/AGENTS.md](apps/web/AGENTS.md), where `next dev` maintains it.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`NiclasDev63/scibly-lms`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.
