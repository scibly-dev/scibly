import { loadPackageEnv } from "@scibly/lib/internal";
export const getPgDatabaseUrl = (): string => {
  const env = loadPackageEnv("@scibly/db", {
    DATABASE_URL: process.env.DATABASE_URL,
  });
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  try {
    const url = new URL(connectionString);
    if (url.searchParams.get("sslrootcert") === "system") {
      url.searchParams.delete("sslrootcert");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
};
