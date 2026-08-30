import { db } from "@scibly/db";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { McpConsentScreen } from "@/features/auth/client";
import { consentDestinations } from "@/features/auth/server";

type ConsentSearchParams = { client_id?: string; consent_code?: string };

export default function McpConsentPage(props: {
  searchParams: Promise<ConsentSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="text-ink-soft h-6 w-6 animate-spin" />
        </div>
      }
    >
      <McpConsent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function McpConsent({
  searchParams,
}: {
  searchParams: Promise<ConsentSearchParams>;
}) {
  const { client_id: clientId, consent_code: consentCode } = await searchParams;
  if (!clientId || !consentCode) notFound();

  const application = await db.oauthApplication.findUnique({
    where: { clientId },
    select: { name: true, redirectUrls: true },
  });
  if (!application) notFound();

  return (
    <McpConsentScreen
      agentName={application.name}
      agentOrigins={consentDestinations(application.redirectUrls)}
      consentCode={consentCode}
    />
  );
}
