import { describe, expect, it } from "vitest";

import {
  answerOrderSeed,
  applyDisplayOrder,
  orderCandidatesForLearner,
  resolveDisplayOrder,
} from "./answer-order";

const candidates = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `item-${index + 1}`);

const SEEDS = [
  "block-1|enrolment-a|0",
  "block-1|enrolment-b|0",
  "block-1|enrolment-a|1",
  "block-2|enrolment-a|0",
  "block-9|enrolment-zzz|7",
];

const SHUFFLED_SIZES = [3, 4, 5, 8, 20];

describe("answer order", () => {
  describe("ORD1 a learner never sees the authored order", () => {
    it.each(
      SHUFFLED_SIZES.flatMap((size) => SEEDS.map((seed) => ({ size, seed }))),
    )("$size candidates, seed $seed", ({ size, seed }) => {
      const authored = candidates(size);

      expect(orderCandidatesForLearner(authored, seed)).not.toEqual(authored);
    });

    it.each(
      SHUFFLED_SIZES.flatMap((size) => SEEDS.map((seed) => ({ size, seed }))),
    )(
      "shows every candidate exactly once — $size candidates, seed $seed",
      ({ size, seed }) => {
        const authored = candidates(size);
        const displayed = orderCandidatesForLearner(authored, seed);

        expect([...displayed].sort()).toEqual([...authored].sort());
      },
    );

    it("leaves the authored list untouched", () => {
      const authored = candidates(6);
      const before = [...authored];

      orderCandidatesForLearner(authored, SEEDS[0]!);

      expect(authored).toEqual(before);
    });
  });

  describe("ORD3 the same learner sees the same order every time", () => {
    it.each(SEEDS)("seed %s", (seed) => {
      const authored = candidates(7);

      expect(orderCandidatesForLearner(authored, seed)).toEqual(
        orderCandidatesForLearner(authored, seed),
      );
    });
  });

  describe("ORD2 different learners see different orders", () => {
    it("two seeds over the same question disagree", () => {
      const authored = candidates(8);

      expect(orderCandidatesForLearner(authored, SEEDS[0]!)).not.toEqual(
        orderCandidatesForLearner(authored, SEEDS[1]!),
      );
    });

    it("a question with many candidates spreads learners across many orders", () => {
      const authored = candidates(10);
      const orders = new Set(
        Array.from({ length: 50 }, (_, learner) =>
          orderCandidatesForLearner(
            authored,
            `block-1|learner-${learner}|0`,
          ).join(),
        ),
      );

      expect(orders.size).toBeGreaterThan(40);
    });
  });

  describe("ORD9 nothing to order", () => {
    it.each([[[]], [["only-item"]]])(
      "%j is displayed as authored",
      (authored) => {
        expect(orderCandidatesForLearner(authored, SEEDS[0]!)).toEqual(
          authored,
        );
      },
    );
  });

  describe("ORD2 the seed separates learners and questions", () => {
    const base = { blockId: "block-1", learnerId: "enrolment-a", attempt: 0 };

    it.each([
      { changed: "learner", input: { ...base, learnerId: "enrolment-b" } },
      { changed: "question", input: { ...base, blockId: "block-2" } },
    ])("a different $changed seeds a different order", ({ input }) => {
      expect(answerOrderSeed(input)).not.toEqual(answerOrderSeed(base));
    });

    it("two learners cannot be conflated by ids that run together", () => {
      expect(
        answerOrderSeed({ blockId: "a", learnerId: "b-c", attempt: 0 }),
      ).not.toEqual(
        answerOrderSeed({ blockId: "a-b", learnerId: "c", attempt: 0 }),
      );
    });

    it("the same learner on the same question seeds the same order", () => {
      expect(answerOrderSeed(base)).toEqual(answerOrderSeed({ ...base }));
    });
  });

  describe("ORD4 a retry reshuffles", () => {
    it("a later attempt seeds a different order", () => {
      const attempt = (count: number) =>
        answerOrderSeed({
          blockId: "block-1",
          learnerId: "enrolment-a",
          attempt: count,
        });

      expect(new Set([attempt(0), attempt(1), attempt(2)]).size).toBe(3);
    });
  });

  describe("ORD11 an absent attempt counter is the first attempt", () => {
    it("undefined seeds what zero seeds", () => {
      expect(
        answerOrderSeed({
          blockId: "block-1",
          learnerId: "enrolment-a",
          attempt: undefined,
        }),
      ).toEqual(
        answerOrderSeed({
          blockId: "block-1",
          learnerId: "enrolment-a",
          attempt: 0,
        }),
      );
    });
  });

  describe("resolveDisplayOrder — what a surface actually shows", () => {
    const authored = candidates(5);
    const learner = {
      blockId: "block-1",
      identity: { learnerId: "enrolment-a", attempt: 0 },
      isAuthoring: false,
    };

    it("ORD7 an author editing the question sees the authored order", () => {
      expect(
        resolveDisplayOrder({
          ...learner,
          candidateIds: authored,
          isAuthoring: true,
        }),
      ).toEqual(authored);
    });

    it("ORD1 a learner does not", () => {
      expect(
        resolveDisplayOrder({ ...learner, candidateIds: authored }),
      ).not.toEqual(authored);
    });

    it("ORD3 the same learner and attempt resolve to the same order", () => {
      expect(
        resolveDisplayOrder({ ...learner, candidateIds: authored }),
      ).toEqual(resolveDisplayOrder({ ...learner, candidateIds: authored }));
    });

    it.each([
      {
        differing: "learner",
        other: { learnerId: "enrolment-b", attempt: 0 },
      },
      {
        differing: "attempt",
        other: { learnerId: "enrolment-a", attempt: 1 },
      },
    ])("ORD2/ORD4 a different $differing resolves differently", ({ other }) => {
      expect(
        resolveDisplayOrder({ ...learner, candidateIds: authored }),
      ).not.toEqual(
        resolveDisplayOrder({
          ...learner,
          candidateIds: authored,
          identity: other,
        }),
      );
    });

    it("ORD8 an anonymous learner is ordered like any other", () => {
      const anonymous = resolveDisplayOrder({
        ...learner,
        candidateIds: authored,
        identity: { learnerId: "anon-session-1", attempt: 0 },
      });

      expect(anonymous).not.toEqual(authored);
      expect([...anonymous].sort()).toEqual([...authored].sort());
    });

    it("ORD13 a preview is ordered from whichever id it was given", () => {
      const preview = resolveDisplayOrder({
        ...learner,
        candidateIds: authored,
        identity: { learnerId: "author-user-1", attempt: 0 },
      });

      expect(preview).not.toEqual(authored);
      expect(preview).toEqual(
        resolveDisplayOrder({
          ...learner,
          candidateIds: authored,
          identity: { learnerId: "author-user-1", attempt: 0 },
        }),
      );
    });

    it("ORD14 an unknown learner is still not shown the authored order", () => {
      expect(
        resolveDisplayOrder({
          ...learner,
          candidateIds: authored,
          identity: { learnerId: null, attempt: undefined },
        }),
      ).not.toEqual(authored);
    });

    it("ORD11 an absent attempt resolves as the first attempt", () => {
      expect(
        resolveDisplayOrder({
          ...learner,
          candidateIds: authored,
          identity: { learnerId: "enrolment-a", attempt: undefined },
        }),
      ).toEqual(resolveDisplayOrder({ ...learner, candidateIds: authored }));
    });

    it("ORD9 leaves a single candidate alone in every mode", () => {
      expect(
        resolveDisplayOrder({ ...learner, candidateIds: ["only"] }),
      ).toEqual(["only"]);
    });
  });

  describe("applyDisplayOrder — ids back to what is rendered", () => {
    const tiles = [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma" },
    ];
    const byId = (tile: { id: string }) => tile.id;

    it("renders in the order it was given", () => {
      expect(applyDisplayOrder(tiles, byId, ["c", "a", "b"])).toEqual([
        tiles[2],
        tiles[0],
        tiles[1],
      ]);
    });

    it("renders as authored when there is no order", () => {
      expect(applyDisplayOrder(tiles, byId, null)).toEqual(tiles);
    });

    it("leaves no hole where a deleted candidate used to be", () => {
      expect(
        applyDisplayOrder(tiles, byId, ["c", "deleted", "a", "b"]),
      ).toEqual([tiles[2], tiles[0], tiles[1]]);
    });

    it("still renders a candidate the order has not caught up with", () => {
      expect(applyDisplayOrder(tiles, byId, ["c", "a"])).toEqual([
        tiles[2],
        tiles[0],
        tiles[1],
      ]);
    });
  });

  describe("ORD5 a matching-pairs right column is never aligned with its rows", () => {
    const rights = (count: number): string[] =>
      Array.from({ length: count }, (_, index) => `r${index + 1}`);

    it.each([3, 4, 6].flatMap((size) => SEEDS.map((seed) => ({ size, seed }))))(
      "$size pairs, seed $seed",
      ({ size, seed }) => {
        const authored = rights(size);

        expect(orderCandidatesForLearner(authored, seed)).not.toEqual(authored);
      },
    );

    it("accepts a single tile landing beside its own left item", () => {
      const authored = rights(6);
      const columns = Array.from({ length: 50 }, (_, learner) =>
        orderCandidatesForLearner(authored, `block-1|learner-${learner}|0`),
      );

      expect(
        columns.some((column) =>
          column.some((id, index) => id === authored[index]),
        ),
      ).toBe(true);
    });
  });

  describe("ORD12 two candidates may coincide with the authored order", () => {
    it("some learners see the authored order and some the reverse", () => {
      const authored = candidates(2);
      const displayed = Array.from({ length: 50 }, (_, learner) =>
        orderCandidatesForLearner(
          authored,
          `block-1|learner-${learner}|0`,
        ).join(),
      );

      expect(new Set(displayed)).toEqual(
        new Set([authored.join(), [...authored].reverse().join()]),
      );
    });
  });
});
