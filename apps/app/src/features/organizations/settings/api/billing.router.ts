import { createTRPCRouter } from "@scibly/api/trpc";

import { billingProcedures } from "./billing-procedures";

export const billingRouter = createTRPCRouter({
  ...billingProcedures,
});
