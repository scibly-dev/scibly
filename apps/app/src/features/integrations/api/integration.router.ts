import { createTRPCRouter } from "@scibly/api/trpc";

import { integrationConnectionProcedures } from "./integration-connection-procedures";
import { integrationPageProcedures } from "./integration-page-procedures";

export const integrationRouter = createTRPCRouter({
  ...integrationConnectionProcedures,
  ...integrationPageProcedures,
});
