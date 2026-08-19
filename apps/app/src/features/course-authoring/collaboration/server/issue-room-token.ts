import type { CollaborationRoomKind } from "@/shared/content/editor/collaboration/contracts";

import { AppError } from "@scibly/api/application-error";
import { CollabDocument } from "@scibly/lib/collab";
import {
  type CollabRoomAccess,
  issueCollabRoomToken,
} from "@scibly/lib/collab-token";

import { env } from "@/env";

import {
  authorizeCourseMetadataRoom,
  authorizeSceneEditorRoom,
} from "../../access/server/policy";

type SessionUser = {
  id: string;
  name: string;
  username?: string | null;
};

export async function issueAuthorizedRoomToken(input: {
  room: string;
  kind: CollaborationRoomKind;
  user?: SessionUser;
}) {
  const { access, subject, name } = await authorizeRoom(input);
  return issueCollabRoomToken({
    secret: env.COLLAB_TOKEN_SECRET,
    subject,
    name,
    room: input.room,
    access,
    tokenId: crypto.randomUUID(),
    ttlSeconds: 60,
  });
}

async function authorizeRoom({
  room,
  kind,
  user,
}: {
  room: string;
  kind: CollaborationRoomKind;
  user?: SessionUser;
}): Promise<{
  access: CollabRoomAccess;
  subject: string;
  name: string;
}> {
  if (!user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      applicationCode: "auth.required",
      message: "Unauthorized",
    });
  }
  const actor = { userId: user.id };
  const identity = {
    subject: user.id,
    name: user.username ?? user.name,
  };

  if (kind === "course-metadata") {
    const courseId = room.startsWith("course-meta-")
      ? room.slice("course-meta-".length)
      : "";
    if (!courseId) throwInvalidRoom();
    const decision = await authorizeCourseMetadataRoom(actor, courseId);
    return { access: decision.access, ...identity };
  }

  const document = assertSceneRoom(room);
  const decision = await authorizeSceneEditorRoom(actor, document.sceneId);
  return {
    access: kind === "scene-preview" ? "read" : decision.access,
    ...identity,
  };
}

function assertSceneRoom(room: string) {
  if (room.startsWith("course-meta-")) throwInvalidRoom();
  const document = CollabDocument.parse(room);
  if (!document.sceneId) throwInvalidRoom();
  return document;
}

function throwInvalidRoom(): never {
  throw new AppError({
    code: "BAD_REQUEST",
    applicationCode: "collab.invalid_room",
    message: "Invalid collaboration room.",
  });
}
