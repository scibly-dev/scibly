import type { Prisma } from "@scibly/db";

// Disconnecting takes the credential and leaves the row: the sources stay
// linked to it, and the next connect can see which workspace they came from.
// Holding neither credential column is therefore the whole of what
// "disconnected" means — nothing else marks it.
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
