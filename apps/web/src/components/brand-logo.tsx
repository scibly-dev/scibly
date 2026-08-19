import { cn } from "@scibly/ui/utils";
import Image from "next/image";

import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

const LOCAL_BRAND_LOGOS = new Map([
  ["anthropic.com", "/logos/anthropic.svg"],
  ["azure.microsoft.com", "/logos/azure-openai.svg"],
  ["confluence.atlassian.com", "/logos/confluence.svg"],
  ["notion.so", "/logos/notion.svg"],
  ["openai.com", "/logos/openai.svg"],
  ["slack.com", "/logos/slack.svg"],
]);

export function BrandLogo({
  domain,
  alt,
  size = 28,
}: {
  domain: string;
  alt: string;
  size?: number;
}) {
  const src = LOCAL_BRAND_LOGOS.get(domain) ?? SCIBLY_MARK_SRC;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain"
      style={{ height: size, width: size }}
    />
  );
}

export function SciblyMark({
  size = 22,
  className,
  alt = "scibly",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src={SCIBLY_MARK_SRC}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-md object-contain", className)}
      style={{ height: size, width: size }}
    />
  );
}

export function TeamsLogo({
  size = 18,
  className,
  title = "Microsoft Teams",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/logos/microsoft-teams.svg"
      alt={title}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      style={{ height: size, width: size }}
    />
  );
}
