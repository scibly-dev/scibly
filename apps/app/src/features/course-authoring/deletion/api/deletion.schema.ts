import { z } from "zod";

export const deletionReasonSchema = z.string().min(1).max(500);

export const deletionIdsSchema = z.array(z.string()).min(1).max(30);
