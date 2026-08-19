import { createTRPCRouter, protectedProcedure } from "@scibly/api/trpc";

import { listLearnerCertificates } from "../server/certificates";
import { listCertificatesSchema } from "./schema";

export const certificatesRouter = createTRPCRouter({
  listCertificates: protectedProcedure
    .input(listCertificatesSchema)
    .query(({ input, ctx }) =>
      listLearnerCertificates(ctx.session.user.id, input.orgSlug),
    ),
});
