import { protectedProcedure } from "@scibly/api/trpc";
import { db } from "@scibly/db";

export const onboardingProcedures = {
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardingStep: "COMPLETED" },
    });
  }),
};
