import { type RouterOutputs } from "@/shared/api/trpc/client";

export type Organization = RouterOutputs["organization"]["listMyOrgs"][number];
