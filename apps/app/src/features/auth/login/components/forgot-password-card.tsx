"use client";
import { requestPasswordReset } from "@scibly/auth/client";
import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@scibly/ui/components/card";
import { Input } from "@scibly/ui/components/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useTranslation } from "@/i18n/hooks/use-translation";

export const ForgotPasswordCard = (props: {
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setShowPasswordReset: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { translations } = useTranslation("auth");
  const [email, setEmail] = useState("");

  const handleSendResetLink = async () => {
    if (!email || !z.email().safeParse(email).success) {
      toast.error(translations.forgotPasswordCard.invalidEmail);
      return;
    }
    const lowerCaseEmail = email.trim().toLowerCase();
    await requestPasswordReset(
      { email: lowerCaseEmail, redirectTo: routes.app.auth.resetPassword },
      {
        onSuccess: () => {
          props.setEmail(lowerCaseEmail);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl">
          {translations.forgotPasswordCard.title}
        </CardTitle>
        <CardDescription className="text-center">
          {translations.forgotPasswordCard.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          variant="brand"
          className="w-full"
          onClick={handleSendResetLink}
          {...autocaptureAttributes({ action: "reset_password_request" })}
        >
          {translations.forgotPasswordCard.sendLink}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => props.setShowPasswordReset(false)}
          {...autocaptureAttributes({ action: "reset_password_back" })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.forgotPasswordCard.back}
        </Button>
      </CardFooter>
    </Card>
  );
};

ForgotPasswordCard.displayName = "ForgotPasswordCard";
export default ForgotPasswordCard;
