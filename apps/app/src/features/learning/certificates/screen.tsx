import { getSession } from "@scibly/auth/session";
import { routes } from "@scibly/routes";
import { redirect } from "next/navigation";

import { api, HydrateClient } from "@/shared/api/trpc/server";

import CertificateList from "./components/certificate-list";

export async function CertificatesScreen({ orgSlug }: { orgSlug: string }) {
  const session = await getSession();
  if (!session?.user) return redirect(routes.app.auth.default);

  void api.learning.listCertificates.prefetch({ orgSlug });
  return (
    <HydrateClient>
      <CertificateList orgSlug={orgSlug} />
    </HydrateClient>
  );
}
