import type * as React from "react";

import { Resend } from "resend";

import { type SenderType,TYPE_TO_MAIL_MAP } from "../types";

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey && !process.env.SKIP_ENV_VALIDATION) {
  throw new Error("@scibly/email missing envs: RESEND_API_KEY");
}

export const resend = new Resend(resendApiKey ?? "skip-env-validation");

type SendMailOptions = {
  from: SenderType;
  to: string;
  subject: string;
  react: React.ReactElement;
};

export default function sendEmail({
  from,
  to,
  subject,
  react,
}: SendMailOptions) {
  return resend.emails.send({
    from: TYPE_TO_MAIL_MAP[from],
    to,
    subject,
    react,
  });
}
