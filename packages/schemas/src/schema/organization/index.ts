import { z } from "zod/v4";

/** The org a procedure acts on, addressed the way the URL addresses it. */
export const orgSlugInput = z.object({ orgSlug: z.string() });

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens",
    ),
  logo: z.string().url().optional(),
});

export const updateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug may only contain lowercase letters, numbers and hyphens",
    )
    .optional(),
  logo: z.string().url().optional(),
});
