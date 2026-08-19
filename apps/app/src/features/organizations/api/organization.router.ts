import { createTRPCRouter } from "@scibly/api/trpc";

import { onboardingProcedures } from "../onboarding/api/onboarding-procedures";
import { organizationInvitationProcedures } from "./organization-invitation-procedures";
import { organizationMemberProcedures } from "./organization-member-procedures";
import { organizationProfileProcedures } from "./organization-profile-procedures";

export const organizationRouter = createTRPCRouter({
  ...organizationProfileProcedures,
  ...organizationMemberProcedures,
  ...organizationInvitationProcedures,
  ...onboardingProcedures,
});
