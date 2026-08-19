"use client";

import { routes } from "@scibly/routes";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { COMPANY_NAME } from "@scibly/ui/marketing/logo";
import { useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import FormBase from "../components/form-base";
import RegisterSuccessCard from "../register/components/register-success-card";
import ForgotPasswordCard from "./components/forgot-password-card";
import ResetPasswordSuccessCard from "./components/reset-password-success-card";
import SignInForm from "./components/sign-in-form";

export const LoginScreen = () => {
  const { translations } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);

  if (verifyEmail && email) {
    return <RegisterSuccessCard email={email} />;
  }

  if (email) {
    return <ResetPasswordSuccessCard email={email} />;
  }

  if (showPasswordReset) {
    return (
      <ForgotPasswordCard
        setEmail={setEmail}
        setShowPasswordReset={setShowPasswordReset}
      />
    );
  }

  return (
    <ErrorBoundaryWrapper>
      <FormBase
        title={translations.loginPage.title.replace("Scibly", COMPANY_NAME)}
        redirectLink={{
          href: routes.app.auth.signUp,
          text: translations.loginPage.redirectText,
          label: translations.loginPage.redirectLabel,
        }}
      >
        <SignInForm
          setEmail={setEmail}
          setVerifyEmail={setVerifyEmail}
          setShowPasswordReset={setShowPasswordReset}
        />
      </FormBase>
    </ErrorBoundaryWrapper>
  );
};
