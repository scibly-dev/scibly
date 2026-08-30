import { httpsUrl } from "@scibly/schemas/common";
import { orgSlugInput } from "@scibly/schemas/organization";
import { z } from "zod";

import {
  INTEGRATION_PROVIDERS,
  MAX_LINKED_PAGES_PER_REQUEST,
  PAGE_INTEGRATION_PROVIDERS,
} from "../contracts";

export { orgSlugInput };

// An unrecognised provider is a bad request here, before any org is resolved or any row is read.
export const providerInput = z.enum(INTEGRATION_PROVIDERS);

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
  query: z.string().max(200).default(""),
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
        url: httpsUrl(),
      }),
    )
    .min(1)
    .max(MAX_LINKED_PAGES_PER_REQUEST),
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
