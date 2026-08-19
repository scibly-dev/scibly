import { AppError, type AppErrorOptions } from "../application-error";

// What a refused decision carries, thrown by `assertAllowed` on behalf of every caller.
export type Refusal = {
  applicationCode: string;

  code?: AppErrorOptions["code"];
  message: string;
  details?: AppErrorOptions["details"];
};

// A policy's answer: the domain facts a caller wants, plus the refusal to raise. `refusal` is null exactly when allowed.
export type Decision<Facts = unknown> = Facts & { refusal: Refusal | null };

export const assertAllowed = <Facts>(decision: Decision<Facts>): void => {
  if (!decision.refusal) return;
  throw new AppError({ code: "PAYMENT_REQUIRED", ...decision.refusal });
};
