import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductAnalytics } from "./product-analytics";

const capture = vi.fn();

vi.mock("@scibly/observability/client", () => ({
  usePostHog: () => ({ capture }),
}));

// The key shape `@trpc/react-query` v11 builds, spelled out because it lives behind a private entrypoint.
const mutationKey = (path: string) => [path.split(".")];

function RunMutation({
  path,
  variables,
  fails = false,
}: {
  path: string;
  variables?: unknown;
  fails?: boolean;
}) {
  const mutation = useMutation({
    mutationKey: mutationKey(path),
    mutationFn: async (_variables: unknown) => {
      if (fails) throw new Error("nope");
      return "ok";
    },
  });

  useEffect(() => {
    mutation.mutate(variables);
    // Firing once on mount is the whole point; `mutation` is a new object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function renderWithClient(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductAnalytics />
      {children}
    </QueryClientProvider>,
  );
}

describe("ProductAnalytics", () => {
  beforeEach(() => capture.mockClear());

  it("reports an allowlisted mutation under its product event name", async () => {
    renderWithClient(<RunMutation path="course.publishCourse" />);

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("course_published", {
        kind: undefined,
      }),
    );
  });

  it("carries the organization the action happened in", async () => {
    renderWithClient(
      <RunMutation
        path="organization.inviteMembers"
        variables={{ orgSlug: "acme" }}
      />,
    );

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("members_invited", {
        kind: undefined,
        orgSlug: "acme",
      }),
    );
  });

  it("resolves procedures nested under a sub-router", async () => {
    renderWithClient(<RunMutation path="notebook.source.addText" />);

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("source_added", {
        kind: undefined,
      }),
    );
  });

  it("puts a purchase on the checkout funnel with what was bought", async () => {
    renderWithClient(
      <RunMutation
        path="billing.startTopupCheckout"
        variables={{ orgSlug: "acme", pack: "large" }}
      />,
    );

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("checkout_started", {
        kind: "topup",
        orgSlug: "acme",
        pack: "large",
      }),
    );
  });

  it("leaves out mutation input that is not worth reporting", async () => {
    renderWithClient(
      <RunMutation
        path="course.create"
        variables={{ orgSlug: "acme", title: "Secret course" }}
      />,
    );

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("course_created", {
        kind: undefined,
        orgSlug: "acme",
      }),
    );
  });

  it("completes a plan upgrade from the URL Stripe returned to", async () => {
    window.history.replaceState(null, "", "/de/profile/acme/billing?plan=pro");
    renderWithClient(null);

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("checkout_completed", {
        kind: "plan",
        plan: "pro",
      }),
    );
    expect(window.location.search).toBe("");
  });

  it("ignores a return URL without the upgrade marker", async () => {
    window.history.replaceState(null, "", "/de/profile/acme/billing");
    renderWithClient(<RunMutation path="course.create" />);

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("course_created", {
        kind: undefined,
      }),
    );
    expect(capture).toHaveBeenCalledTimes(1);
  });

  // Both negatives run a tracked mutation alongside the one under test and wait for *its*
  // event, so the cache has drained before we conclude nothing was reported.
  it("stays silent for mutations that are not on the allowlist", async () => {
    renderWithClient(
      <>
        <RunMutation path="scene.reorderScenes" />
        <RunMutation path="course.create" />
      </>,
    );

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("course_created", {
        kind: undefined,
      }),
    );
    expect(capture).toHaveBeenCalledTimes(1);
  });

  it("reports nothing when the mutation failed", async () => {
    renderWithClient(
      <>
        <RunMutation path="course.publishCourse" fails />
        <RunMutation path="course.create" />
      </>,
    );

    await waitFor(() =>
      expect(capture).toHaveBeenCalledWith("course_created", {
        kind: undefined,
      }),
    );
    expect(capture).toHaveBeenCalledTimes(1);
  });
});
