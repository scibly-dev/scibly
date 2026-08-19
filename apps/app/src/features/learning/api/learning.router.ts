import { mergeTRPCRouters } from "@scibly/api/trpc";

import { certificatesRouter } from "../certificates/api/certificates.router";
import { coursePlayerRouter } from "../course-player/api/course-player.router";
import { learningDashboardRouter } from "../dashboard/api/dashboard.router";

export const learningRouter = mergeTRPCRouters(
  coursePlayerRouter,
  learningDashboardRouter,
  certificatesRouter,
);
