import { loadPackageEnv } from "./internal";

export const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const env = loadPackageEnv("@scibly/lib", {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  });
  return env.NEXT_PUBLIC_BASE_URL;
};
