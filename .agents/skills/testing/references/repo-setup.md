# Repo test infrastructure

Verify against the actual config files if anything looks stale.

## Harness prerequisites

`apps/app/vitest.config.ts` aliases two modules to stub files — `server-only` (throws by design outside a server context) and `next/headers` (throws outside a request scope). If the targets are absent, pure tests pass but any server-side import fails:

```
Error: Failed to resolve import "server-only" from "src/features/organizations/server.ts".
```

Create whichever are missing before the first test in the package.

`apps/app/__test__/mocks/server-only.ts`
```typescript
export {};
```

`apps/app/__test__/mocks/next-headers.ts`
```typescript
export const headers = () => new Headers();
export const cookies = () => ({
  get: () => undefined,
  getAll: () => [],
  set: () => {},
  delete: () => {},
  has: () => false,
});
```

`packages/observability` needs `src/__test__/mocks/server-only.ts` with the same body.

These are inert import stubs, not test doubles — they exist so modules load under jsdom. A test needing real header or cookie behaviour overrides it in-file; the shared stub stays boring because everything depends on it.

**Do not stub `react-katex`.** KaTeX renders fully under jsdom — real `.katex` markup and a MathML `<annotation>` carrying the source LaTeX. A stub returning raw LaTeX proves only that the string reached the component, never that it typesets. Assert against the rendered output.

## Layout

Colocate: `progression-rules.ts` → `progression-rules.test.ts`. Every vitest config includes `src/**/*.test.{ts,tsx}` only.

`.spec.ts` belongs to Playwright (`testDir: ./__test__/e2e`). A `src/*.spec.ts` runs in **neither** runner and reports no failures because it never executes. Always `.test.ts` / `.test.tsx` under `src/`. (Same trap at the suite level: if `testDir` is absent, an e2e run reports success while executing nothing.)

Spec artifacts (`<subject>.spec.md`) are safe in `src/` while they exist — the architecture invariant tests scan only `.ts` / `.tsx`. They are scratch, and Phase 7 deletes them; a `.spec.md` still sitting in `src/` means a run that stopped early.

## Commands

From the package directory:

```bash
pnpm exec vitest run src/path/file.test.ts   # single file — use while iterating
pnpm exec vitest run -t "B4"                 # filter by behaviour ID
pnpm test                                    # vitest run, whole package
pnpm test:watch
pnpm typecheck                               # tsc --noEmit
pnpm lint
```

Root: `pnpm test:unit` (turbo, all packages), `pnpm check` (typecheck + lint).

Full package runs are slow enough to discourage the tight loop mutation testing needs — run the single file.

## apps/app config

jsdom · `globals: true` · `setupFiles: ./vitest.setup.ts` · `include: src/**/*.test.{ts,tsx}` · `@vitejs/plugin-react` · v8 coverage.

| Alias | Target |
|---|---|
| `@` | `apps/app/src` |
| `server-only` | `__test__/mocks/server-only.ts` |
| `next/headers` | `__test__/mocks/next-headers.ts` |

## Gotchas

**`global.fetch` is stubbed for every test.** `vitest.setup.ts` installs a stub resolving to an object with **no `ok`, no `status`, no `text()`, no `headers`**. Code checking `response.ok` sees `undefined` and takes the failure branch; `response.text()` throws.

```typescript
beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<h1>Title</h1>", { status: 200 }))));
afterEach(() => vi.unstubAllGlobals());
```

Better: inject the fetch boundary as a parameter and skip the global entirely.

**jest-dom is not registered.** `@testing-library/jest-dom` is a dependency but unimported by the setup file. Without `import "@testing-library/jest-dom/vitest";` at the top of a component test, `toBeInTheDocument` fails with `Invalid Chai property`.

**Env is preset** in `vitest.setup.ts` — `SKIP_ENV_VALIDATION=true`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_*`, collab vars. Env validation is skipped; a test asserting missing-config behaviour sets that up itself.

**Polyfills** installed for jsdom: `ReadableStream`, `TextEncoder`, `TextDecoder`, `MessageChannel`, `MessagePort`.

**Mock hoisting.** `vi.mock` hoists above imports, so its factory cannot close over a later `const`. Use `vi.hoisted`:

```typescript
const onRender = vi.hoisted(() => vi.fn());
vi.mock("./content-editor", () => ({ ContentEditor: (p: unknown) => { onRender(p); return null; } }));
```

**Isolation.** Reset spies between tests. Module-level mocks persist across a file, and a leftover `mockResolvedValueOnce` is a nasty trace.

## Other packages

`apps/web` and `packages/observability` use the same core settings but have **no setup file** — no env presets, no polyfills, no stubbed `fetch`. `apps/web` aliases `@` → `src` and `server-only`; `packages/observability` aliases `server-only` only. `packages/showcase`, `packages/schemas`, and `apps/collab` also have `test` scripts — check their configs first.

## Conventions

- Derive types from Prisma, tRPC, or shared types — hand-rolled test types drift from the schema.
- Absolute `@` imports; relative only for the SUT (`./progression-rules`).
