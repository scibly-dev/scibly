import { NextResponse } from "next/server";

export const checkStaticFiles = (
  pathname: string,
): NextResponse | undefined => {
  const hasFileExtension =
    /\.(svg|png|jpg|jpeg|gif|webp|ico|json|txt|pdf|mp3|mp4|webm|woff2?)$/.test(
      pathname,
    );
  if (pathname.startsWith("/_next") || hasFileExtension) {
    return NextResponse.next();
  }
};
