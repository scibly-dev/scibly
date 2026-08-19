# Slop catalogue and audit

Phase 7. **Slop** is a test that is green and worthless. Every entry below is one way to produce it.

## The test

For each test: **what implementation change makes this fail?**

- "None" / "a compile error" / "not sure" → decorative, delete or fix.
- "Any refactor" → **change detector**, will be deleted by whoever touches it next.
- "Flipping the threshold comparison" → real.

## Catalogue

**1. Characterization** — expected values read off the implementation. Invisible in review; the test looks fine. Prevented only by the Phase 1–3 gate, not by a lint rule.

**2. Tautological** — the expected value is recomputed the way the code computes it, so the test passes by construction and can never disagree with the implementation.

```typescript
✗ const expected = items.reduce((sum, i) => sum + i.price, 0);
  expect(calculateTotal(items)).toBe(expected);
✓ expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
```

Same defect in `expect(add(a, b)).toBe(a + b)` and in a snapshot derived by hand the same way the code derives it. Expected values come from an independent source of truth — a known-good literal, a worked example, the spec.

**3. Vacuous assertions**

```typescript
✗ expect(result).toBeDefined();
✗ expect(result).not.toBeNull();
✗ expect(() => parse(x)).not.toThrow();
✗ expect(Array.isArray(rows)).toBe(true);
```

A function returning `{}` forever satisfies all four. Assert the spec'd value. If the spec only promises "non-null", the spec is unfinished.

`not.toThrow()` is valid only when not-throwing *is* the spec'd behaviour for previously-crashing input — pair it with a value assertion.

**4. Call-count theater** — `toHaveBeenCalledTimes(1)` passes whether the payload was right or catastrophic. Assert the payload:

```typescript
✓ expect(db.course.update).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id }, data: { title: "New title" } }));
```

Counts are valid when the count *is* the behaviour: "retries exactly twice", "does not refetch on re-render".

**5. Over-doubling** — everything stubbed, so the test verifies your stubs agree with your expectations. They always do. *Symptom:* setup longer than the SUT.

**6. Side-channel verification** — the effect is confirmed by reaching past the seam instead of through it, so the test passes even when the interface it exists to protect is broken.

```typescript
✗ await createUser({ name: "Alice" });
  expect(await db.query("SELECT * FROM users WHERE name = ?", ["Alice"])).toBeDefined();
✓ const user = await createUser({ name: "Alice" });
  expect((await getUser(user.id)).name).toBe("Alice");
```

The raw query also pins the schema, so a column rename breaks a test about user creation.

**7. Change detectors** — assertions on class names, DOM nesting, call ordering, object identity, private fields. Fail on every refactor with no behaviour change. Real damage is cultural: people learn to update tests without reading them.

**8. Snapshot blessing** — `toMatchSnapshot()` records whatever runs today and calls it correct; breakage is met with `-u`. Assert the properties the spec names. Inline snapshots only per `patterns.md`.

**9. Happy-path only** — what coverage metrics reward, since the happy path executes most lines. If the spec has no `refuses`/`rejects`/`ignores` behaviours, the interview was unfinished.

**10. Logic in the test**

```typescript
✗ if (result.kind === "rejected") expect(result.reason).toBe("NO_TRIES_REMAINING");
```

False condition → asserts nothing, passes green. Same bug in loops, ternaries, and `try/catch` around an expected throw. Normalise instead, or use `expect(...).rejects` / `.toThrow()`. One path per test.

**11. Shared mutable state** — module-scope `Set`/array/object mutated across tests. Order-dependent results; the failure surfaces in a different test from its cause, the worst class of flake. Build fresh in `beforeEach`.

**12. Multi-behaviour blob** — one `it` asserting across several behaviours; the first failure masks the rest and the name can't describe the break. Several assertions describing *one* behaviour are fine.

**13. Bending the test to the code** — the failure that undoes everything. A failing spec-derived test means **the implementation is the suspect**. Changing the expected value converts a bug report into a bug endorsement, now much harder to find. Route it through Phase 4; if the spec was genuinely wrong, update the artifact too.

**14. Testing the dependency** — *Ours, not theirs* violated in code. Green forever until an upgrade, when it fails for reasons you cannot fix in this repo.

**15. Partition padding** — several cases through one branch. It survives mutation testing *as a block*: the redundant cases go red together, so the redundancy is invisible exactly where you would expect to catch it.

## Audit checklist

Anything unchecked is fixed or disclosed in the report.

**Provenance**
- [ ] Every expected value traces to a spec behaviour, not to observed output.
- [ ] No expected value recomputed the way the implementation computes it.
- [ ] No test adjusted to match the implementation without the spec being corrected.
- [ ] Divergences reported as findings.

**Substance**
- [ ] Every test fails under some plausible implementation change.
- [ ] Every behaviour verified through its seam, not a side channel.
- [ ] No test's sole assertion is `toBeDefined` / `not.toBeNull` / `not.toThrow` / a type check.
- [ ] Outcomes carry the claim; counts only where the count is the behaviour.
- [ ] No snapshot substitutes for a decision.
- [ ] Boundary, failure, and negative-space behaviours present.

**Structure**
- [ ] One behaviour per test; names carry spec IDs.
- [ ] No conditionals, loops, or `try/catch` around assertions.
- [ ] Fresh state per `beforeEach`; no shared mutable state.
- [ ] Doubles only at boundaries; SUT and its call graph undoubled.
- [ ] No double contains branching logic.

**Economy**
- [ ] Every test asserts a decision this repo makes, not a dependency's behaviour.
- [ ] No two cases exercise the same partition.
- [ ] Nothing tested that is neither critical, complex, nor explicitly requested.

**Hygiene**
- [ ] No `as any` / `as unknown` / `@ts-expect-error`.
- [ ] No `.skip` / `.only` / `.todo`.
- [ ] Names read as domain behaviour, not function names.
- [ ] `pnpm exec vitest run <path>` and `pnpm typecheck` pass.

**Coverage**
- [ ] Every spec behaviour has a test; every test maps to a behaviour.
- [ ] Mutation results recorded for critical behaviours.
