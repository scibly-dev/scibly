import type { ExtractableSource, SourceExtractor } from "./types";

import { db } from "@scibly/db";

import {
  getPageProvider,
  resolveConnectionToken,
} from "@/features/integrations/server";

async function resolveIntegration(source: ExtractableSource) {
  if (!source.integrationId || !source.externalId) {
    throw new Error(
      `Integration source ${source.type} missing integrationId or externalId.`,
    );
  }

  const connection = await db.integrationConnection.findUnique({
    where: { id: source.integrationId },
  });

  if (!connection) {
    throw new Error(
      `Integration connection not found (id=${source.integrationId}).`,
    );
  }

  const notebook = await db.notebook.findUnique({
    where: { id: source.notebookId },
    select: { organizationId: true },
  });
  if (!notebook || notebook.organizationId !== connection.organizationId) {
    throw new Error(
      `Integration connection ${connection.id} does not belong to source ${source.id}'s organization.`,
    );
  }

  return {
    provider: getPageProvider(connection.provider),
    token: await resolveConnectionToken(connection),
    externalId: source.externalId,
  };
}

export const notionPageExtractor: SourceExtractor = {
  isIntegration: true,

  async getRevision(source) {
    const { provider, token, externalId } = await resolveIntegration(source);
    return provider.getPageRevision(token, externalId);
  },

  async extract(source) {
    const { provider, token, externalId } = await resolveIntegration(source);
    const content = await provider.fetchPageContent(token, externalId);

    return {
      text: content.text,
      pageCount: content.pageCount,
      title: content.title,
      lastEdited: content.lastEdited,
    };
  },
};
