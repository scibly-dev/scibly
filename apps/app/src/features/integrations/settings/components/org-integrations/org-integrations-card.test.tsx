import type { OrgSettingsPage } from "@/features/organizations/contracts";

import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useList = vi.hoisted(() => vi.fn());
const useGrants = vi.hoisted(() => vi.fn());
const invalidate = vi.hoisted(() => vi.fn());
const authUrlMutate = vi.hoisted(() => vi.fn());
const disconnectMutate = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());

// The two mutations are handed their own callbacks, so a test decides which one a click runs — that is how a failed disconnect is staged.
vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({ integration: { list: { invalidate } } }),
    integration: {
      list: { useQuery: useList },
      listGrants: { useQuery: useGrants },
      getAuthUrl: {
        useMutation: (options: unknown) => ({
          mutate: (input: unknown) => authUrlMutate(input, options),
          isPending: false,
        }),
      },
      disconnect: {
        useMutation: (options: unknown) => ({
          mutate: (input: unknown) => disconnectMutate(input, options),
          isPending: false,
        }),
      },
    },
  },
}));
vi.mock("sonner", () => ({
  toast: { error: toastError, success: toastSuccess },
}));

const { OrgIntegrationsCard } = await import("./org-integrations-card");

const t = {
  title: "Integrations",
  description: "Connect the systems your material lives in.",
  connectButton: "Connect",
  disconnectButton: "Disconnect",
  cancelButton: "Keep it",
  confirmDisconnectTitle: "Disconnect integration?",
  confirmDisconnectDescription: "Sources stay; re-syncing stops.",
  connectedStatus: "Connected",
  notConnectedStatus: "Not connected",
  disconnectedSuccessfully: "Disconnected.",
  grantsTitle: "Repositories",
  grantsLoading: "Loading repositories…",
  grantsEmpty: "No repositories.",
  grantsError: "Could not load repositories.",
  grantsMore: "{count} more",
  grantsShown: "Showing {shown} of {total}.",
  revokedNotice: "Disconnected on {provider}'s side.",
  noProvidersAvailable: "Nothing to connect to.",
  providers: { NOTION: "Notion", GITHUB: "GitHub" },
} as OrgSettingsPage["integrations"];

const NOTION = { providerId: "NOTION" as const, displayName: "Notion" };
const GITHUB = {
  providerId: "GITHUB" as const,
  displayName: "GitHub",
  listsGrants: true,
};

function lists(allProviders: unknown[], connections: unknown[] = []): void {
  useList.mockReturnValue({ data: { allProviders, connections } });
}

function grants(...names: string[]): void {
  grantsOf(names.length, ...names);
}

function grantsOf(totalCount: number, ...names: string[]): void {
  useGrants.mockReturnValue({
    data: {
      grants: names.map((name, index) => ({
        id: String(index),
        name,
        url: `https://github.com/${name}`,
      })),
      totalCount,
    },
    isPending: false,
    isError: false,
    error: null,
  });
}

const card = () =>
  render(<OrgIntegrationsCard orgSlug="acme" lang="en" t={t} />).container;

const button = (container: HTMLElement, label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

// The confirmation is portalled out of the card, so it is found on the page rather than inside it.
const dialog = () =>
  document.body.querySelector<HTMLElement>("[role='alertdialog']");

const inDialog = (label: string) =>
  Array.from(dialog()?.querySelectorAll("button") ?? []).find(
    (candidate) => candidate.textContent === label,
  );

beforeEach(() => {
  vi.clearAllMocks();
  lists([NOTION]);
  grants();
});

describe("what a row says about a provider", () => {
  it("offers to connect a provider no connection was made to", () => {
    const container = card();

    expect(button(container, "Connect Notion")?.disabled).toBe(false);
    expect(container.textContent).toContain("Not connected");
  });

  it("names the workspace a connection reaches", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);

    const container = card();

    expect(container.textContent).toContain("Connected · Acme HQ");
    expect(button(container, "Disconnect Notion")).not.toBeNull();
  });

  it("says only connected when the workspace has no name", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: null }]);

    expect(card().textContent).toContain("Connected");
  });
});

describe("which mark stands for which provider", () => {
  const NOTION_PATH = "M4.459 4.208";
  const GITHUB_PATH = "M12 .5C5.37";

  const drawn = (container: HTMLElement) =>
    container.querySelector("svg path")?.getAttribute("d") ?? "";

  it("draws Notion's mark for NOTION", () => {
    expect(drawn(card())).toContain(NOTION_PATH);
  });

  it("draws GitHub's mark for GITHUB", () => {
    lists([GITHUB]);

    expect(drawn(card())).toContain(GITHUB_PATH);
  });
});

describe("a card with no providers to offer", () => {
  it("says so", () => {
    lists([]);

    expect(card().textContent).toContain("Nothing to connect to.");
  });
});

describe("what a click asks for", () => {
  it("asks for the auth url of the provider whose row was clicked", () => {
    fireEvent.click(button(card(), "Connect Notion")!);

    expect(authUrlMutate).toHaveBeenCalledWith(
      { orgSlug: "acme", provider: "NOTION", lang: "en" },
      expect.anything(),
    );
  });

  it("asks before disconnecting rather than disconnecting", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);

    fireEvent.click(button(card(), "Disconnect Notion")!);

    expect(dialog()?.textContent).toContain("Disconnect integration?");
    expect(disconnectMutate).not.toHaveBeenCalled();
  });

  it("disconnects the provider the confirmation was opened for", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);
    fireEvent.click(button(card(), "Disconnect Notion")!);

    fireEvent.click(inDialog("Disconnect")!);

    expect(disconnectMutate).toHaveBeenCalledWith(
      { orgSlug: "acme", provider: "NOTION" },
      expect.anything(),
    );
  });

  it("disconnects nothing when the confirmation is refused", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);
    fireEvent.click(button(card(), "Disconnect Notion")!);

    fireEvent.click(inDialog("Keep it")!);

    expect(dialog()).toBeNull();
    expect(disconnectMutate).not.toHaveBeenCalled();
  });

  it("asks about the row just clicked, not the row refused before it", () => {
    lists(
      [NOTION, GITHUB],
      [
        { provider: "NOTION", workspaceName: "Acme HQ" },
        { provider: "GITHUB", workspaceName: "acme-inc" },
      ],
    );
    const container = card();
    fireEvent.click(button(container, "Disconnect Notion")!);
    fireEvent.click(inDialog("Keep it")!);

    fireEvent.click(button(container, "Disconnect GitHub")!);
    fireEvent.click(inDialog("Disconnect")!);

    expect(disconnectMutate).toHaveBeenCalledWith(
      { orgSlug: "acme", provider: "GITHUB" },
      expect.anything(),
    );
  });
});

describe("a disconnect that failed", () => {
  it("says so and hands the row's button back", () => {
    lists([NOTION], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);
    disconnectMutate.mockImplementation(
      (
        _input,
        options: { onError: (error: Error) => void; onSettled: () => void },
      ) => {
        options.onError(new Error("provider said no"));
        options.onSettled();
      },
    );
    const container = card();

    fireEvent.click(button(container, "Disconnect Notion")!);
    fireEvent.click(inDialog("Disconnect")!);

    expect(toastError).toHaveBeenCalledWith("provider said no");
    expect(button(container, "Disconnect Notion")?.disabled).toBe(false);
  });
});

describe("the grants strip", () => {
  it("appears only for a connected provider that hands access out", () => {
    lists([NOTION, GITHUB], [{ provider: "NOTION", workspaceName: "Acme HQ" }]);
    grants("acme-inc/api");

    expect(card().textContent).not.toContain("Repositories");
  });

  it("renders every grant the connection reaches", () => {
    lists([GITHUB], [{ provider: "GITHUB", workspaceName: "acme-inc" }]);
    grants("acme-inc/api", "acme-inc/web", "acme-inc/docs");

    const container = card();

    expect(container.querySelectorAll("li")).toHaveLength(3);
    expect(container.textContent).toContain("acme-inc/docs");
  });

  it("keeps the strip short and puts the rest behind a count", () => {
    lists([GITHUB], [{ provider: "GITHUB", workspaceName: "acme-inc" }]);
    grants(...Array.from({ length: 9 }, (_, i) => `acme-inc/repo-${i}`));

    const container = card();

    expect(container.querySelectorAll("li")).toHaveLength(5);
    expect(container.textContent).toContain("5 more");
    expect(container.textContent).not.toContain("acme-inc/repo-8");
  });

  it("counts what the provider reported, not what it managed to list", () => {
    lists([GITHUB], [{ provider: "GITHUB", workspaceName: "acme-inc" }]);
    grantsOf(1500, ...Array.from({ length: 10 }, (_, i) => `acme-inc/r-${i}`));

    expect(card().textContent).toContain("1496 more");
  });

  it("says the connection reaches nothing rather than showing an empty list", () => {
    lists([GITHUB], [{ provider: "GITHUB", workspaceName: "acme-inc" }]);
    grants();

    expect(card().textContent).toContain("No repositories.");
  });

  it("names the provider that went away, and refetches the list", () => {
    lists([GITHUB], [{ provider: "GITHUB", workspaceName: "acme-inc" }]);
    useGrants.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { data: { applicationCode: "integration.revoked" } },
    });

    card();

    expect(toastError).toHaveBeenCalledWith("Disconnected on GitHub's side.", {
      id: "integration-revoked-GITHUB",
    });
    expect(invalidate).toHaveBeenCalledWith({ orgSlug: "acme" });
  });
});
