import { sendVerificationEmail } from "@scibly/auth/client";
import { routes } from "@scibly/routes";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import SuccessCard from "@/features/auth/components/success-card";
import { useTranslation } from "@/i18n/hooks/use-translation";

type Step = {
  number: number;
  text: string;
};

const StepComponent = ({ number, text }: Step) => {
  return (
    <li className="flex gap-2">
      <span className="bg-brand-blue-muted text-brand-blue flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs">
        {number}
      </span>
      <span>{text}</span>
    </li>
  );
};

type RegisterSuccessCardProps = {
  email: string;
};

export default function RegisterSuccessCard({
  email,
}: RegisterSuccessCardProps) {
  const { translations } = useTranslation("auth");

  const handleResendEmail = async () => {
    if (!email || !z.email().safeParse(email).success) {
      toast.error(translations.registerSuccessCard.invalidEmail);
      return false;
    }
    let success = true;

    await sendVerificationEmail(
      { email, callbackURL: routes.app.auth.callback.login.success },
      {
        onError: (error) => {
          toast.error(
            error.error.message || translations.registerSuccessCard.resendError,
          );
          success = false;
        },
      },
    );

    return success;
  };

  const steps = translations.registerSuccessCard.steps;

  return (
    <SuccessCard
      title={translations.registerSuccessCard.title}
      description={translations.registerSuccessCard.description}
      redirectButtonOptions={{
        href: routes.app.auth.default,
        label: translations.registerSuccessCard.redirectLabel,
      }}
      resendButtonOptions={{
        countDownLabel: translations.registerSuccessCard.countDownLabel,
        resendSuccessMessage:
          translations.registerSuccessCard.resendSuccessMessage,
        label: translations.registerSuccessCard.resendLabel,
        onClick: handleResendEmail,
        analyticsAction: "resend_verification_email",
      }}
    >
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
        <Mail className="h-5 w-5 shrink-0 text-slate-500" />
        <div className="text-sm">
          <p>{translations.registerSuccessCard.messagePrefix}</p>
          <p className="font-medium text-slate-900">{email}</p>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          {translations.registerSuccessCard.nextStepsTitle}
        </h3>
        <ol className="space-y-2 text-sm">
          {steps.map((step, index) => (
            <StepComponent key={step} number={index + 1} text={step} />
          ))}
        </ol>
      </div>
    </SuccessCard>
  );
}

RegisterSuccessCard.displayName = "RegisterSuccessCard";
