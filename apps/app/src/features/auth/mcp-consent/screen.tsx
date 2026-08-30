"use client";

import { Button } from "@scibly/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@scibly/ui/components/card";
import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/i18n/hooks/use-translation";

async function requestConsentRedirect(accept: boolean, consentCode: string) {
  const response = await fetch("/api/auth/oauth2/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accept, consent_code: consentCode }),
  });

  const body: unknown = response.ok ? await response.json() : null;
  return body && typeof body === "object" && "redirectURI" in body
    ? body.redirectURI
    : null;
}

export const McpConsentScreen = ({
  agentName,
  agentOrigins,
  consentCode,
}: {
  agentName: string;
  agentOrigins: string[];
  consentCode: string;
}) => {
  const { translations } = useTranslation("auth");
  const [isDeciding, setIsDeciding] = useState(false);

  const decide = async (accept: boolean) => {
    setIsDeciding(true);

    const redirectUri = await requestConsentRedirect(accept, consentCode).catch(
      () => null,
    );

    if (typeof redirectUri !== "string") {
      toast.error(translations.mcpConsentPage.error);
      setIsDeciding(false);
      return;
    }

    window.location.href = redirectUri;
  };

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl">
          {translations.mcpConsentPage.title}
        </CardTitle>
        <CardDescription className="text-center">
          {translations.mcpConsentPage.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-brand-ink space-y-2 rounded-md border bg-gray-50 px-4 py-3 text-center break-words">
          <p className="font-medium">{agentName}</p>
          {agentOrigins.length > 0 && (
            <p className="text-sm text-gray-500">
              {translations.mcpConsentPage.destination}{" "}
              {agentOrigins.map((origin) => (
                <span key={origin} className="text-brand-ink block font-medium">
                  {origin}
                </span>
              ))}
            </p>
          )}
        </div>
        <p className="text-center text-sm text-gray-500">
          {translations.mcpConsentPage.warning}
        </p>
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          disabled={isDeciding}
          onClick={() => decide(false)}
        >
          {translations.mcpConsentPage.deny}
        </Button>
        <Button
          variant="brand"
          className="flex-1"
          disabled={isDeciding}
          onClick={() => decide(true)}
        >
          {isDeciding
            ? translations.mcpConsentPage.working
            : translations.mcpConsentPage.approve}
        </Button>
      </CardFooter>
    </Card>
  );
};
