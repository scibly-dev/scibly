import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

import { type Organization } from "./types";

type Workspace =
  | { type: "personal" }
  | {
      type: "organization";
      orgId: string;
      slug: string;
      role: Organization["role"];
    };

type WorkspaceStore = {
  workspace: Workspace;
  selectPersonal: () => void;
  selectOrganization: (
    orgId: string,
    slug: string,
    role: Organization["role"],
  ) => void;
};

export const useWorkspaceStore = createWithEqualityFn<WorkspaceStore>()(
  (set) => ({
    workspace: { type: "personal" },
    selectPersonal: () => set({ workspace: { type: "personal" } }),
    selectOrganization: (orgId, slug, role) =>
      set({ workspace: { type: "organization", orgId, slug, role } }),
  }),
  shallow,
);
