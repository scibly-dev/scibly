import { AppError } from "@scibly/api/application-error";
import { NextResponse } from "next/server";

import {
  buildOEmbedResponse,
  courseIdFromEmbeddableUrl,
  parseSizeParam,
} from "@/features/learning/embed-course/oembed";
import { requireAnonymousCourse } from "@/features/learning/server";

// Public and CORS-open by necessity — half of oEmbed's consumers resolve links from the
// browser, and nothing this returns isn't already on the course's public page.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

function error(status: number) {
  return new NextResponse(null, {
    status,
    headers: {
      ...CORS,

      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const format = params.get("format");

  if (format && format !== "json") return error(501);

  const url = params.get("url");
  if (!url) return error(400);

  const courseId = courseIdFromEmbeddableUrl(url);
  if (!courseId) return error(404);

  let course;
  try {
    course = await requireAnonymousCourse(courseId);
  } catch (thrown) {
    if (thrown instanceof AppError) return error(404);
    throw thrown;
  }

  return NextResponse.json(
    buildOEmbedResponse({
      course,
      maxWidth: parseSizeParam(params.get("maxwidth")),
      maxHeight: parseSizeParam(params.get("maxheight")),
    }),
    {
      headers: {
        ...CORS,

        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    },
  );
}
