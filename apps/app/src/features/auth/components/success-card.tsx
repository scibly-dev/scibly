"use client";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { Button } from "@scibly/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@scibly/ui/components/card";
import { ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";

type SuccessCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  redirectButtonOptions?: {
    href: string;
    label: string;
  };
  resendButtonOptions: {
    countDownLabel: string;
    countdown?: number;
    resendSuccessMessage: string;
    label: string;
    onClick: () => Promise<boolean>;
    analyticsAction: string;
  };
};

export const SuccessCard = ({
  title,
  description,
  children,
  redirectButtonOptions,
  resendButtonOptions,
}: SuccessCardProps) => {
  const { translations } = useTranslation("auth");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    const success = await resendButtonOptions.onClick();
    setIsResending(false);
    if (success) {
      setCountdown(resendButtonOptions.countdown ?? 60);
      setResendSuccess(true);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center">
      <Card className="w-full border-0 bg-transparent shadow-none">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4 rounded-full bg-green-50 p-3">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
        <CardFooter className="flex flex-col gap-3">
          {redirectButtonOptions && (
            <Link href={redirectButtonOptions.href} className="w-full">
              <Button variant="brand" className="w-full">
                {redirectButtonOptions.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || countdown > 0}
            {...autocaptureAttributes({
              action: resendButtonOptions.analyticsAction,
            })}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {translations.successCard.resending}
              </>
            ) : countdown > 0 ? (
              `${resendButtonOptions.countDownLabel} (${countdown}s)`
            ) : (
              resendButtonOptions.label
            )}
          </Button>
          {resendSuccess && (
            <p className="mt-2 text-center text-sm text-green-600">
              {resendButtonOptions.resendSuccessMessage}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
SuccessCard.displayName = "SuccessCard";
export default SuccessCard;
