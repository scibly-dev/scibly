# anti-slop (vendored)

Vendored from [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), which
ships these as Oxlint rules. Upstream intends them to be vendored and edited, not
pinned as a dependency. MIT, see `LICENSE`.

They run under ESLint unchanged because upstream's `index.ts` wraps the plugin in
`eslintCompatPlugin`, which adds the `create` methods ESLint expects. Only
`@oxlint/plugins` is installed — no Oxlint binary.

## Port delta — reapply when bumping upstream

Oxc AST nodes carry `start`/`end`; typescript-eslint spells the same offsets
`range: [start, end]` and omits `start`/`end` entirely. Every offset read is
rewritten here:

- `rules/no-widen-then-assert.ts` — 4 sites. Left unported the rule silently
  never fires, since `undefined <= undefined` is false.
- `rules/require-safety-comment-for-type-assertion.ts` — 1 site. Left unported
  the rule reports every assertion and no `SAFETY:` comment can satisfy it.

`../../anti-slop-smoke.mjs` covers both failure modes: it asserts each rule fires
on a violating fixture and that a correct `SAFETY:` comment is respected. Run it
with `pnpm test` in this package after any bump.

Branches keyed on `TSParenthesizedType`, `ParenthesizedExpression`, and
`V8IntrinsicExpression` are dead under ESLint — typescript-eslint does not
produce those nodes. Harmless; parenthesized types just go unchecked.
