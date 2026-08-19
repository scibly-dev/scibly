import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type Organization } from "./types";
import { WorkspaceRail } from "./workspace-rail";

const org: Organization = {
  id: "org_1",
  name: "Acme",
  slug: "acme",
  logo: null,
  createdAt: new Date(),
  role: "owner",
  memberCount: 1,
};

function renderRail(organizations: Organization[]) {
  render(
    <WorkspaceRail
      userName="Ada"
      userImage={null}
      organizations={organizations}
      activeWorkspace={{ type: "personal" }}
      onSelectPersonal={() => {}}
      onSelectOrg={() => {}}
      onCreateOrg={() => {}}
    />,
  );
  return screen.queryByLabelText("Create organization");
}

describe("WorkspaceRail create-organization affordance", () => {
  it("offers creation while the user has no organization", () => {
    expect(renderRail([])).not.toBeNull();
  });

  it("hides creation once the user has one, matching organizationLimit: 1", () => {
    expect(renderRail([org])).toBeNull();
  });
});
