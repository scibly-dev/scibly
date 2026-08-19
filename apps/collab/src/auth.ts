import { verifyCollabRoomToken } from "@scibly/lib/collab-token";

import { config } from "./config.js";

export function authenticateConnection(token: string, documentName: string) {
  const claims = verifyCollabRoomToken({
    secret: config.tokenSecret,
    token,
    room: documentName,
  });
  return {
    user: {
      id: claims.subject,
      name: claims.name,
    },
    access: claims.access,
    tokenId: claims.tokenId,
  };
}
