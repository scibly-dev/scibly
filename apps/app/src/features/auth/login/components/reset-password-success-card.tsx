import { requestPasswordReset } from "@scibly/auth/client";
import { routes } from "@scibly/routes";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import SuccessCard from "@/features/auth/components/success-card";
import { useTranslation } from "@/i18n/hooks/use-translation";

type ResetPasswordSuccessCardProps = {
  email: string;
};

export default function ResetPasswordSuccessCard({
  email,
}: ResetPasswordSuccessCardProps) {
  const { translations } = useTranslation("auth");

  const handleResendEmail = async () => {
    if (!email || !z.email().safeParse(email).success) {
      toast.error(translations.resetPasswordSuccessCard.invalidEmail);
      return false;
    }
    let success = true;
    const lowerCaseEmail = email.trim().toLowerCase();

    await requestPasswordReset(
      { email: lowerCaseEmail, redirectTo: routes.app.auth.resetPassword },
      {
        onError: (ctx) => {
          toast.error(
            ctx.error.message ||
              translations.resetPasswordSuccessCard.resendError,
          );
          success = false;
        },
      },
    );

    return success;
  };

  return (
    <SuccessCard
      title={translations.resetPasswordSuccessCard.title}
      resendButtonOptions={{
        countDownLabel: translations.resetPasswordSuccessCard.countDownLabel,
        resendSuccessMessage:
          translations.resetPasswordSuccessCard.resendSuccessMessage,
        label: translations.resetPasswordSuccessCard.resendLabel,
        onClick: handleResendEmail,
        analyticsAction: "resend_password_reset_email",
      }}
    >
      <div className="bg-brand-blue-muted rounded-lg p-4">
        <div className="flex">
          <Mail className="text-brand-blue mr-2 h-5 w-5" />
          <div className="text-brand-ink text-sm">
            <p>{translations.resetPasswordSuccessCard.message}</p>
          </div>
        </div>
      </div>
    </SuccessCard>
  );
}

ResetPasswordSuccessCard.displayName = "ResetPasswordSuccessCard";
