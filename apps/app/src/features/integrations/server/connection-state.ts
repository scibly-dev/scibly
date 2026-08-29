import type { Prisma } from "@scibly/db";

// Holding neither credential column is the whole of what "disconnected" means: the row
// stays so a reconnect can see which workspace its sources came from.
export const DISCONNECTED_CREDENTIAL = {
  accessTokenEncrypted: null,
  installationId: null,
};

export const CONNECTED = {
  OR: [
    { accessTokenEncrypted: { not: null } },
    { installationId: { not: null } },
  ],
} satisfies Prisma.IntegrationConnectionWhereInput;

export function isConnected(connection: {
  accessTokenEncrypted: string | null;
  installationId: string | null;
}): boolean {
  return Boolean(connection.accessTokenEncrypted ?? connection.installationId);
}
