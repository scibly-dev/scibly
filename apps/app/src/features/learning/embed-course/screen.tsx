import { headers } from "next/headers";

import "./embed-base-scale.css";
import { api, HydrateClient } from "@/shared/api/trpc/server";

import { AnonymousCoursePlayer } from "../public-course/components/anonymous-course-player";
import { normalizeEmbedOrigin } from "../public-course/server/anonymous-session";
import { EmbedViewportSync } from "./components/embed-viewport-sync";

export async function EmbedCourseScreen({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const hostOrigin = normalizeEmbedOrigin((await headers()).get("referer"));

  void api.course.getPublicCourse.prefetch({ courseId });

  return (
    <HydrateClient>
      <EmbedViewportSync hostOrigin={hostOrigin} />
      <AnonymousCoursePlayer
        courseId={courseId}
        source="EMBED"
        embedOrigin={hostOrigin}
      />
    </HydrateClient>
  );
}
