import React from "react";

import { CourseRoomProvider } from "@/features/course-authoring/collaboration/components/course-room-provider";
import { CollabWebsocketProvider } from "@/shared/content/editor/collaboration/collab-websocket-provider";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <CollabWebsocketProvider>
      <CourseRoomProvider courseId={courseId}>{children}</CourseRoomProvider>
    </CollabWebsocketProvider>
  );
}
