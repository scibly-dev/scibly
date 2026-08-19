import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

import { CertificatesScreen } from "@/features/learning/certificates/screen";

export const metadata: Metadata = constructMetadata({
  title: "My Certificates",
  description: "Certificates of completion for your finished courses.",
  noIndex: true,
});

export default async function LearnCertificatesPage(props: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await props.params;
  return <CertificatesScreen orgSlug={orgSlug} />;
}
