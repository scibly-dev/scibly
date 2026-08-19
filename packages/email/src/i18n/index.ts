import type { Locale } from "@scibly/i18n/constants";

import { getLocale } from "@scibly/i18n";

import {
  type AllowanceWarningLevel,
  type AllowanceWarningMailMessages,
  allowanceWarningMailMessages,
  type ConfirmMailMessages,
  confirmMailMessages,
  type InvitationMailMessages,
  invitationMailMessages,
  type PublicSessionCeilingMailMessages,
  publicSessionCeilingMailMessages,
  type ResetPasswordMailMessages,
  resetPasswordMailMessages,
} from "./messages";

export type {
  AllowanceWarningLevel,
  AllowanceWarningMailMessages,
  ConfirmMailMessages,
  InvitationMailMessages,
  PublicSessionCeilingMailMessages,
  ResetPasswordMailMessages,
};

export const getConfirmMailMessages = (locale: Locale): ConfirmMailMessages =>
  confirmMailMessages[getLocale(locale, true)];

export const getResetPasswordMailMessages = (
  locale: Locale,
): ResetPasswordMailMessages =>
  resetPasswordMailMessages[getLocale(locale, true)];

export const getInvitationMailMessages = (
  locale: Locale,
): InvitationMailMessages =>
  invitationMailMessages[getLocale(locale, true)];

export const getAllowanceWarningMailMessages = (
  locale: Locale,
): AllowanceWarningMailMessages =>
  allowanceWarningMailMessages[getLocale(locale, true)];

export const getPublicSessionCeilingMailMessages = (
  locale: Locale,
): PublicSessionCeilingMailMessages =>
  publicSessionCeilingMailMessages[getLocale(locale, true)];
