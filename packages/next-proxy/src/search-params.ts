import type { NextRequest } from "next/server";

export const copySearchParams = (
  request: NextRequest,
  url: URL,
  additionalParams?: URLSearchParams,
): void => {
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  if (additionalParams) {
    additionalParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }
};
