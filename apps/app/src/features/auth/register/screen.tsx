"use client";
import { routes } from "@scibly/routes";
import { ErrorBoundaryWrapper } from "@scibly/ui/components/error-boundary-wrapper";
import { COMPANY_NAME } from "@scibly/ui/marketing/logo";
import { useState } from "react";

import { useTranslation } from "@/i18n/hooks/use-translation";

import FormBase from "../components/form-base";
import RegisterSuccessCard from "./components/register-success-card";
import SignUpForm from "./components/sign-up-form";

export const RegisterScreen = () => {
  const { translations } = useTranslation("auth");
  const [email, setEmail] = useState("");

  if (email) {
    return <RegisterSuccessCard email={email} />;
  }

  return (
    <ErrorBoundaryWrapper>
      <FormBase
        title={
          translations.registerPage.title
            ? translations.registerPage.title.replace("Scibly", COMPANY_NAME)
            : `Los geht's mit ${COMPANY_NAME}`
        }
        redirectLink={{
          href: routes.app.auth.default,
          text: translations.registerPage.redirectText,
          label: translations.registerPage.redirectLabel,
        }}
      >
        <SignUpForm setEmail={setEmail} />
      </FormBase>
    </ErrorBoundaryWrapper>
  );
};
