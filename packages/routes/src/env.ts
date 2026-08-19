import { loadPackageEnv } from "@scibly/lib/internal";
export const env = loadPackageEnv("@scibly/routes", {
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL:
    process.env.NEXT_PUBLIC_PYTHON_BACKEND_BASE_URL,
  NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
});
