import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsArea } from "./analytics-area";

const useParams = vi.hoisted(() => vi.fn());
const useQuery = vi.hoisted(() => vi.fn());
const setAnalyticsContext = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useParams }));
vi.mock("@/shared/api/trpc/client", () => ({
  api: { organization: { listMyOrgs: { useQuery } } },
}));
vi.mock("@scibly/observability/event-context", () => ({ setAnalyticsContext }));

const acme = { id: "org_1", slug: "acme", name: "Acme", role: "owner" };
const globex = { id: "org_2", slug: "globex", name: "Globex", role: "member" };

function at(orgSlug: string | undefined) {
  useParams.mockReturnValue(orgSlug ? { orgSlug } : {});
}

beforeEach(() => {
  vi.clearAllMocks();
  useQuery.mockReturnValue({ data: [acme, globex] });
  at(undefined);
});

describe("AnalyticsArea", () => {
  it("reports the organization the route is in", () => {
    at("acme");
    render(<AnalyticsArea />);

    expect(setAnalyticsContext).toHaveBeenCalledWith({
      area: "organization",
      org_id: "org_1",
      org_name: "Acme",
      role: "owner",
    });
  });

  it("reports the user's own space off the organization routes", () => {
    render(<AnalyticsArea />);

    expect(setAnalyticsContext).toHaveBeenCalledWith({ area: "personal" });
  });

  it("replaces the whole context on the way out of an organization", () => {
    at("acme");
    const view = render(<AnalyticsArea />);

    at(undefined);
    view.rerender(<AnalyticsArea />);

    // Replaced, not merged — otherwise `role` would outlive the organization it came from.
    expect(setAnalyticsContext).toHaveBeenLastCalledWith({ area: "personal" });
  });

  // Kept apart from "personal": calling an organization route personal while data is still missing is a wrong answer, not a missing one.
  it("stays quiet while the organization list is still loading", () => {
    at("acme");
    useQuery.mockReturnValue({ data: undefined });
    render(<AnalyticsArea />);

    expect(setAnalyticsContext).not.toHaveBeenCalled();
  });

  it("stays quiet on an organization the user is not a member of", () => {
    at("initech");
    render(<AnalyticsArea />);

    expect(setAnalyticsContext).not.toHaveBeenCalled();
  });
});
