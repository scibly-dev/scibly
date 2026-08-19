import { z } from "zod";

import { INTEGRATION_PROVIDERS } from "../contracts";

export const orgSlugInput = z.object({ orgSlug: z.string() });

// An unrecognised provider is a bad request here, before any org is resolved or any row is read.
export const providerInput = z.enum(INTEGRATION_PROVIDERS);

export const getAuthUrlSchema = z.object({
  orgSlug: z.string(),
  provider: providerInput,
  lang: z.string().default("en"),
});

export const disconnectIntegrationSchema = z.object({
  orgSlug: z.string(),
  provider: providerInput,
});

export const searchPagesSchema = z.object({
  orgSlug: z.string(),
  provider: providerInput,
  query: z.string().default(""),
});

export const linkPageSchema = z.object({
  notebookId: z.string(),
  orgSlug: z.string(),
  provider: providerInput,
  pageId: z.string(),
  pageTitle: z.string(),
  pageUrl: z.string().url(),
});

export const linkPagesSchema = z.object({
  notebookId: z.string(),
  orgSlug: z.string(),
  provider: providerInput,
  pages: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().url(),
      }),
    )
    .min(1)
    .max(20),
});

export const resyncSourceSchema = z.object({
  sourceId: z.string(),
  orgSlug: z.string(),
});

export const listPageChildrenSchema = z.object({
  orgSlug: z.string(),
  provider: providerInput,
  pageId: z.string(),
  nodeType: z.enum(["page", "database"]).default("page"),
});
