import { orgSlugInput } from "@scibly/schemas/organization";
import { z } from "zod";

import {
  INTEGRATION_PROVIDERS,
  PAGE_INTEGRATION_PROVIDERS,
} from "../contracts";

// Re-exported so call sites keep importing their own feature's schema module.
export { orgSlugInput };

// An unrecognised provider is a bad request here, before any org is resolved or any row is read.
export const providerInput = z.enum(INTEGRATION_PROVIDERS);

// Anything page-shaped narrows further: a provider without pages has nothing
// to search, browse, or link.
export const pageProviderInput = z.enum(PAGE_INTEGRATION_PROVIDERS);

export const getAuthUrlSchema = orgSlugInput.extend({
  provider: providerInput,
  lang: z.string().default("en"),
});

export const disconnectIntegrationSchema = orgSlugInput.extend({
  provider: providerInput,
});

export const listGrantsSchema = orgSlugInput.extend({
  provider: providerInput,
});

export const searchPagesSchema = orgSlugInput.extend({
  provider: pageProviderInput,
  query: z.string().default(""),
});

export const linkPageSchema = z.object({
  notebookId: z.string(),
  orgSlug: z.string(),
  provider: pageProviderInput,
  pageId: z.string(),
  pageTitle: z.string(),
  pageUrl: z.string().url(),
});

export const linkPagesSchema = z.object({
  notebookId: z.string(),
  orgSlug: z.string(),
  provider: pageProviderInput,
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

export const listPageChildrenSchema = orgSlugInput.extend({
  provider: pageProviderInput,
  pageId: z.string(),
  nodeType: z.enum(["page", "database"]).default("page"),
});
