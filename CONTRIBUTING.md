# Contributing

- [Open an issue](https://github.com/NiclasDev63/scibly-lms/issues) if
  you've found a bug or want to propose a change before writing code.
- Follow [docs/setup.md](docs/setup.md) to get a local dev environment
  running.
- Follow [apps/app/src/ARCHITECTURE.md](apps/app/src/ARCHITECTURE.md) for
  where new code belongs — code lives at the narrowest folder that owns all
  of its callers, not wherever's convenient.
- Before opening a [pull request](https://github.com/NiclasDev63/scibly-lms/pulls),
  run from the root:

  ```bash
  pnpm check      # typecheck + lint + format check, every workspace
  pnpm test:unit  # vitest, every workspace
  pnpm build      # apps/app and apps/web
  ```

  Run `pnpm format:write` to auto-fix formatting.
  CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs the same
  three on every PR — a clean local run means it'll pass.

By participating in this project you agree to abide by the
[Code of Conduct](CODE_OF_CONDUCT.md).
