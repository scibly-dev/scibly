/**
 * Authors write the correct answer first, so the authored order is itself a
 * correctness signal that must be scrambled before a learner sees it.
 */

type AnswerOrderSeedInput = {
  blockId: string;

  learnerId: string;

  attempt: number | undefined;
};

/**
 * Length-prefixed rather than delimited: two learners whose ids run together
 * under a plain separator ("a" + "b-c" vs "a-b" + "c") would otherwise share
 * one order.
 */
export function answerOrderSeed({
  blockId,
  learnerId,
  attempt,
}: AnswerOrderSeedInput): string {
  const part = (value: string) => `${value.length}:${value}`;
  return `${part(blockId)}${part(learnerId)}${attempt ?? 0}`;
}

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
}

function isAuthoredOrder(
  displayed: readonly string[],
  authored: readonly string[],
): boolean {
  return displayed.every((id, index) => id === authored[index]);
}

/**
 * Deterministic in `seed`, so a learner returning to the question sees what
 * they left; below three candidates the authored order can still show
 * through, since the only alternative — reversal — just relocates the tell
 * rather than removing it.
 */
export function orderCandidatesForLearner(
  candidateIds: readonly string[],
  seed: string,
): string[] {
  const displayed = [...candidateIds];
  if (displayed.length < 2) return displayed;

  const random = createRandom(hashSeed(seed));
  for (let index = displayed.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));
    const held = displayed[index]!;
    displayed[index] = displayed[swapWith]!;
    displayed[swapWith] = held;
  }

  if (displayed.length >= 3 && isAuthoredOrder(displayed, candidateIds)) {
    displayed.push(displayed.shift()!);
  }

  return displayed;
}

/**
 * The order can briefly disagree with `values` while an author edits; both
 * directions resolve toward the current values, not the order — a missing id
 * is dropped, and an unordered value is still shown, appended at the end.
 */
export function applyDisplayOrder<T>(
  values: readonly T[],
  id: (value: T) => string,
  order: readonly string[] | null,
): T[] {
  if (!order) return [...values];

  const remaining = new Map(values.map((value) => [id(value), value]));
  const ordered: T[] = [];

  for (const key of order) {
    const value = remaining.get(key);
    if (value === undefined) continue;
    remaining.delete(key);
    ordered.push(value);
  }

  return [...ordered, ...remaining.values()];
}

export type AnswerOrderIdentity = {
  learnerId: string | null;
  attempt: number | undefined;
};

type DisplayOrderInput = {
  candidateIds: readonly string[];
  blockId: string;
  identity: AnswerOrderIdentity;

  isAuthoring: boolean;
};

/**
 * The single decision every question block routes through: authored order for
 * the author, a seeded order for everyone else.
 */
export function resolveDisplayOrder({
  candidateIds,
  blockId,
  identity,
  isAuthoring,
}: DisplayOrderInput): string[] {
  if (isAuthoring) return [...candidateIds];

  return orderCandidatesForLearner(
    candidateIds,
    answerOrderSeed({
      blockId,

      learnerId: identity.learnerId ?? "",
      attempt: identity.attempt,
    }),
  );
}
