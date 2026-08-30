import type { KnowledgeTopic } from "../contracts";

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import knowledgeEn from "../i18n/knowledge.i18n.en.json";
import { TopicDialog } from "./topic-dialog";

const listFolders = vi.hoisted(() => vi.fn());
const listGrants = vi.hoisted(() => vi.fn());
const listMembers = vi.hoisted(() => vi.fn());
const createMutation = vi.hoisted(() => vi.fn());
const updateMutation = vi.hoisted(() => vi.fn());
const invalidate = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/trpc/client", () => ({
  api: {
    useUtils: () => ({ knowledge: { list: { invalidate } } }),
    knowledge: {
      listFolders: { useQuery: listFolders },
      create: { useMutation: createMutation },
      update: { useMutation: updateMutation },
    },
    integration: { listGrants: { useQuery: listGrants } },
    organization: { listMembers: { useQuery: listMembers } },
  },
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

const t = knowledgeEn.knowledge;

type MutationOptions = {
  onSuccess: (saved: { externallyEditedAt: Date | null }) => void;
  onError: (failure: { message: string }) => void;
};

const mutate = vi.fn();
// The dialog hands its callbacks to `useMutation`; holding on to them is how a test plays the server's answer back.
let lastUpdateOptions: MutationOptions;

const topic = {
  id: "topic-1",
  name: "Onboarding guide",
  language: "en",
  repositories: [
    { id: "repo-a", fullName: "acme/docs", pathGlobs: ["docs/**", "src/**"] },
    { id: "repo-b", fullName: "acme/api", pathGlobs: [] },
  ],
  maintainers: [{ memberId: "member-1", name: "Ada", email: "ada@acme.test" }],
  pendingSuggestions: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as KnowledgeTopic;

const grants = [
  { id: "repo-a", name: "acme/docs" },
  { id: "repo-b", name: "acme/api" },
];

beforeEach(() => {
  vi.clearAllMocks();
  listFolders.mockReturnValue({ data: { folders: [] }, isPending: false });
  listGrants.mockReturnValue({
    data: { grants, totalCount: grants.length },
    isPending: false,
  });
  listMembers.mockReturnValue({
    data: [
      { id: "member-1", user: { name: "Ada", email: "ada@acme.test" } },
      { id: "member-2", user: { name: "Grace", email: "grace@acme.test" } },
    ],
  });
  createMutation.mockReturnValue({ mutate, isPending: false });
  updateMutation.mockImplementation((options: MutationOptions) => {
    lastUpdateOptions = options;
    return { mutate, isPending: false };
  });
});

const open = (edited: KnowledgeTopic | null = topic) =>
  render(
    <TopicDialog
      t={t}
      orgSlug="acme"
      orgId="org-1"
      defaultLanguage="en"
      topic={edited}
      onClose={() => {}}
    />,
  );

const save = () =>
  screen.getByRole("button", { name: t.form.save }) as HTMLButtonElement;
const nameInput = () =>
  screen.getByPlaceholderText(t.form.namePlaceholder) as HTMLInputElement;
const patternInput = () =>
  screen.getAllByPlaceholderText(t.form.globPlaceholder)[0]!;
const addGlob = (glob: string) => {
  fireEvent.change(patternInput(), { target: { value: glob } });
  fireEvent.click(screen.getAllByRole("button", { name: t.form.add })[0]!);
};

const removeLabel = (name: string) => t.form.remove.replace("{name}", name);

describe("dirtiness is order-insensitive", () => {
  it("stays clean when a glob is removed and re-added in a different order", () => {
    open();
    expect(save().disabled).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: removeLabel("docs/**") }),
    );
    expect(save().disabled).toBe(false);

    addGlob("docs/**");
    expect(
      screen.getByRole("button", { name: removeLabel("docs/**") }),
    ).not.toBeNull();
    expect(save().disabled).toBe(true);
  });

  it("counts a changed name as a change", () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "Onboarding" } });
    expect(save().disabled).toBe(false);
  });
});

describe("required fields are refused before the network", () => {
  it("refuses a name that is only whitespace", async () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "   " } });
    fireEvent.click(save());

    expect((await screen.findByRole("alert")).textContent).toContain(
      t.form.nameRequired,
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("refuses a topic with no repository left", async () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: removeLabel("acme/docs") }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: removeLabel("acme/api") }),
    );
    fireEvent.click(save());

    expect((await screen.findByRole("alert")).textContent).toContain(
      t.form.repositoriesRequired,
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("sends the fields once they are all there", async () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "Onboarding" } });
    fireEvent.click(save());

    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({
        orgSlug: "acme",
        topicId: "topic-1",
        name: "Onboarding",
        repositories: [
          { id: "repo-a", pathGlobs: ["docs/**", "src/**"] },
          { id: "repo-b", pathGlobs: [] },
        ],
        maintainerMemberIds: ["member-1"],
        language: "en",
      }),
    );
  });
});

describe("path globs are judged where they are typed", () => {
  it("names the glob it refuses and does not add it", () => {
    open();
    addGlob("../secrets");

    expect(screen.getByRole("alert").textContent).toContain(
      t.form.globInvalid.replace("{glob}", "../secrets"),
    );
    expect(
      screen.queryByRole("button", { name: removeLabel("../secrets") }),
    ).toBeNull();
  });

  it("ignores a glob the repository already has", () => {
    open();
    addGlob("docs/**");

    expect(
      screen.getAllByRole("button", { name: removeLabel("docs/**") }),
    ).toHaveLength(1);
    expect(save().disabled).toBe(true);
  });
});

describe("a repository the installation no longer reaches", () => {
  it("says so and asks the server nothing about it", () => {
    listGrants.mockReturnValue({
      data: { grants: [{ id: "repo-b", name: "acme/api" }], totalCount: 1 },
      isPending: false,
    });
    open();

    expect(screen.getByText(t.form.repositoriesUnreachable)).not.toBeNull();
    expect(listFolders).toHaveBeenCalledWith(
      { orgSlug: "acme", repositoryId: "repo-a" },
      { enabled: false },
    );
  });

  it("holds its tongue when the listing stopped at its page budget", () => {
    listGrants.mockReturnValue({
      data: { grants: [{ id: "repo-b", name: "acme/api" }], totalCount: 1200 },
      isPending: false,
    });
    open();

    expect(screen.queryByText(t.form.repositoriesUnreachable)).toBeNull();
  });
});

describe("the folder list is asked for, not assumed", () => {
  it("asks nothing until someone opens it", () => {
    open();

    expect(listFolders).toHaveBeenCalledWith(
      { orgSlug: "acme", repositoryId: "repo-a" },
      { enabled: false },
    );
  });

  it("asks once the list is opened", () => {
    open();
    fireEvent.click(
      screen.getAllByRole("button", { name: t.form.foldersBrowse })[0]!,
    );

    expect(listFolders).toHaveBeenLastCalledWith(
      { orgSlug: "acme", repositoryId: "repo-a" },
      { enabled: true },
    );
  });
});

describe("what the dialog says a save did", () => {
  const saveTopic = async () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "Onboarding" } });
    fireEvent.click(save());
    await waitFor(() => expect(mutate).toHaveBeenCalled());
  };

  it("says the topic was updated when the document went with it", async () => {
    await saveTopic();

    act(() => lastUpdateOptions.onSuccess({ externallyEditedAt: null }));

    expect(toast.success).toHaveBeenCalledWith(t.form.updated);
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("says the page was left alone when someone else had edited it", async () => {
    await saveTopic();

    act(() => lastUpdateOptions.onSuccess({ externallyEditedAt: new Date() }));

    expect(toast.warning).toHaveBeenCalledWith(t.form.updatedDocumentLeft);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("the submit-failure banner", () => {
  it("holds the server's refusal with the form still filled in", async () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "Onboarding" } });
    fireEvent.click(save());
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    act(() =>
      lastUpdateOptions.onError({ message: "A topic with this name exists." }),
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "A topic with this name exists.",
    );
    expect(nameInput().value).toBe("Onboarding");
  });

  it("survives a refusal from the glob field, which speaks for itself", async () => {
    open();
    fireEvent.change(nameInput(), { target: { value: "Onboarding" } });
    fireEvent.click(save());
    await waitFor(() => expect(mutate).toHaveBeenCalled());
    act(() =>
      lastUpdateOptions.onError({ message: "A topic with this name exists." }),
    );

    addGlob("../secrets");

    const alerts = screen.getAllByRole("alert").map((el) => el.textContent);
    expect(alerts).toHaveLength(2);
    expect(alerts.join("")).toContain("A topic with this name exists.");
    expect(alerts.join("")).toContain(
      t.form.globInvalid.replace("{glob}", "../secrets"),
    );
  });
});
