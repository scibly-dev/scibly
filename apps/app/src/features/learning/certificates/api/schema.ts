import { z } from "zod";

export const listCertificatesSchema = z.object({ orgSlug: z.string() });
