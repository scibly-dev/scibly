import { vi } from "vitest";

// Both suites here drive the real dialog, so this mock wiring lives once in a module
// both import for its `vi.mock` side effects, rather than duplicated in either suite.
export const useQuery = vi.fn();
export const useInfiniteQuery = vi.fn();
export const useMutation = vi.fn();

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({
      course: {
        listEnrollments: { invalidate: vi.fn() },
        getStats: { invalidate: vi.fn() },
        getAvailableMembers: { invalidate: vi.fn() },
      },
    }),
    billing: { getFeatureAccess: { useQuery } },
    course: {
      getAvailableMembers: { useInfiniteQuery },
      enrollMembers: { useMutation },
    },
  },
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

export const member = {
  id: "u-1",
  name: "Ada",
  email: "ada@example.com",
  image: null,
};
