import type { Locale } from "@scibly/i18n/constants";

export type ConfirmMailMessages = {
  subject: string;
  preview: (companyName: string) => string;
  greeting: (name: string) => string;
  bodyIntro: (companyName: string) => string;
  confirmButton: string;
  ignoreHint: (companyName: string) => string;
  footer: (companyName: string, supportEmail: string) => string;
  logoAlt: string;
};

export type InvitationMailMessages = {
  subject: string;
  preview: (orgName: string) => string;
  bodyIntro: (inviterName: string, orgName: string) => string;
  confirmButton: string;
  ignoreHint: string;
  footer: (companyName: string, supportEmail: string) => string;
  logoAlt: string;
};

// Declared here rather than imported from the entitlement package so this file depends on nothing but its own locales.
export type AllowanceWarningLevel = 80 | 95;

export type AllowanceWarningMailMessages = {
  byLevel: Record<
    AllowanceWarningLevel,
    {
      subject: string;
      preview: (orgName: string) => string;
      heading: string;
      bodyIntro: (
        orgName: string,
        remaining: number,
        allowance: number,
      ) => string;
      consequence: string;
      manageButton: string;
    }
  >;
  footer: (supportEmail: string) => string;
  logoAlt: string;
};

export type PublicSessionCeilingMailMessages = {
  subject: string;
  preview: (orgName: string) => string;
  heading: string;
  bodyIntro: (orgName: string, used: number, limit: number) => string;
  consequence: string;
  manageButton: string;
  footer: (supportEmail: string) => string;
  logoAlt: string;
};

export type ResetPasswordMailMessages = {
  subject: string;
  preview: (companyName: string) => string;
  greeting: (name: string) => string;
  bodyIntro: (companyName: string) => string;
  resetButton: string;
  ignoreHint: string;
  footer: (supportEmail: string) => string;
  logoAlt: string;
};

export const confirmMailMessages = {
  en: {
    subject: "Verify your email",
    preview: (companyName) =>
      `Welcome to ${companyName} — please confirm your email`,
    greeting: (name) => `Hi ${name}!`,
    bodyIntro: (companyName) =>
      `Thank you for registering with ${companyName}. We're excited to have you on board! To get started, please confirm your email address by clicking the button below.`,
    confirmButton: "Confirm email address",
    ignoreHint: (companyName) =>
      `If you didn't create an account with ${companyName}, you can safely ignore this email.`,
    footer: (companyName, supportEmail) =>
      `This email was sent to you because you registered for an account with ${companyName}. If you have any questions, please contact our support team at ${supportEmail}.`,
    logoAlt: "Scibly logo",
  },
  de: {
    subject: "E-Mail bestätigen",
    preview: (companyName) =>
      `Willkommen bei ${companyName} — bitte bestätige deine E-Mail`,
    greeting: (name) => `Hallo ${name}!`,
    bodyIntro: (companyName) =>
      `vielen Dank für deine Registrierung bei ${companyName}. Wir freuen uns, dass du dabei bist! Um loszulegen, bestätige bitte deine E-Mail-Adresse über den Button unten.`,
    confirmButton: "E-Mail-Adresse bestätigen",
    ignoreHint: (companyName) =>
      `Falls du kein Konto bei ${companyName} erstellt hast, kannst du diese E-Mail ignorieren.`,
    footer: (companyName, supportEmail) =>
      `Diese E-Mail wurde gesendet, weil du ein Konto bei ${companyName} registriert hast. Bei Fragen erreichst du unser Support-Team unter ${supportEmail}.`,
    logoAlt: "Scibly-Logo",
  },
} satisfies Record<Locale, ConfirmMailMessages>;

export const resetPasswordMailMessages = {
  en: {
    subject: "Reset your password",
    preview: (companyName) => `Reset your ${companyName} password`,
    greeting: (name) => `Hi ${name}!`,
    bodyIntro: (companyName) =>
      `We received a request to reset the password for your ${companyName} account. Click the button below to create a new password.`,
    resetButton: "Reset password",
    ignoreHint:
      "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    footer: (supportEmail) =>
      `This password reset link will expire in 60 minutes. If you have any questions, please contact our support team at ${supportEmail}.`,
    logoAlt: "Scibly logo",
  },
  de: {
    subject: "Passwort zurücksetzen",
    preview: (companyName) => `Setze dein ${companyName}-Passwort zurück`,
    greeting: (name) => `Hallo ${name}!`,
    bodyIntro: (companyName) =>
      `wir haben eine Anfrage erhalten, das Passwort für dein ${companyName}-Konto zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort festzulegen.`,
    resetButton: "Passwort zurücksetzen",
    ignoreHint:
      "Falls du keine Passwort-Zurücksetzung angefordert hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.",
    footer: (supportEmail) =>
      `Dieser Link zum Zurücksetzen ist 60 Minuten gültig. Bei Fragen erreichst du unser Support-Team unter ${supportEmail}.`,
    logoAlt: "Scibly-Logo",
  },
} satisfies Record<Locale, ResetPasswordMailMessages>;

export const invitationMailMessages = {
  en: {
    subject: "You've been invited!",
    preview: (orgName) => `You've been invited to join ${orgName}`,
    bodyIntro: (inviterName, orgName) =>
      `${inviterName} has invited you to join ${orgName} on Scibly. Click the button below to accept the invitation and get started.`,
    confirmButton: "Accept invitation",
    ignoreHint:
      "If you're not expecting this invitation, you can safely ignore this email.",
    footer: (companyName, supportEmail) =>
      `If you have any questions, please contact our support team at ${supportEmail}.`,
    logoAlt: "Scibly logo",
  },
  de: {
    subject: "Du wurdest eingeladen!",
    preview: (orgName) => `Du wurdest eingeladen, ${orgName} beizutreten`,
    bodyIntro: (inviterName, orgName) =>
      `${inviterName} hat dich eingeladen, ${orgName} auf Scibly beizutreten. Klicke auf den Button unten, um die Einladung anzunehmen und loszulegen.`,
    confirmButton: "Einladung annehmen",
    ignoreHint:
      "Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.",
    footer: (companyName, supportEmail) =>
      `Bei Fragen erreichst du unser Support-Team unter ${supportEmail}.`,
    logoAlt: "Scibly-Logo",
  },
} satisfies Record<Locale, InvitationMailMessages>;

export const allowanceWarningMailMessages = {
  en: {
    byLevel: {
      80: {
        subject: "Your AI generations are running low",
        preview: (orgName) =>
          `${orgName} has less than a fifth of a month's AI generations left`,
        heading: "Your generations are running low",
        bodyIntro: (orgName, remaining, allowance) =>
          `${orgName} has ${remaining} AI generations left, top-ups included — less than a fifth of the ${allowance} the plan includes each month. Chats, generated images, and indexing a new source each spend from that pool.`,
        consequence:
          "There's still room, and nothing changes today — but at this pace it's worth deciding now whether to upgrade the plan or buy a top-up, rather than after your authors are already stopped.",
        manageButton: "Review plan",
      },
      95: {
        subject: "Your AI generations are nearly gone",
        preview: (orgName) =>
          `${orgName} is about to run out of AI generations`,
        heading: "You're almost out of generations",
        bodyIntro: (orgName, remaining, allowance) =>
          `${orgName} has ${remaining} AI generations left, top-ups included, against the ${allowance} the plan includes each month. That will not last long at normal use.`,
        consequence:
          "When the pool empties, chats, image generation and source indexing stop for everyone in the organization until the allowance resets. Upgrading the plan or buying a top-up takes effect immediately.",
        manageButton: "Add generations",
      },
    },
    footer: (supportEmail) =>
      `You're receiving this because you own or administer this organization. Questions? Contact us at ${supportEmail}.`,
    logoAlt: "Scibly logo",
  },
  de: {
    byLevel: {
      80: {
        subject: "Die KI-Generierungen werden knapp",
        preview: (orgName) =>
          `${orgName} hat weniger als ein Fünftel der monatlichen KI-Generierungen übrig`,
        heading: "Die Generierungen werden knapp",
        bodyIntro: (orgName, remaining, allowance) =>
          `${orgName} hat noch ${remaining} KI-Generierungen, Guthabenpakete eingerechnet – weniger als ein Fünftel der ${allowance}, die der Tarif pro Monat enthält. Chats, generierte Bilder und das Indexieren neuer Quellen greifen alle auf dieses Kontingent zu.`,
        consequence:
          "Es ist noch Luft, und heute ändert sich nichts – bei diesem Tempo lohnt es sich aber, jetzt über ein Upgrade oder ein Guthabenpaket zu entscheiden und nicht erst, wenn deine Autoren bereits ausgebremst sind.",
        manageButton: "Tarif ansehen",
      },
      95: {
        subject: "Die KI-Generierungen sind fast aufgebraucht",
        preview: (orgName) =>
          `${orgName} hat die KI-Generierungen fast aufgebraucht`,
        heading: "Die Generierungen sind fast aufgebraucht",
        bodyIntro: (orgName, remaining, allowance) =>
          `${orgName} hat noch ${remaining} KI-Generierungen, Guthabenpakete eingerechnet – gegenüber ${allowance} pro Monat im Tarif. Im normalen Betrieb ist das schnell weg.`,
        consequence:
          "Ist das Kontingent leer, stoppen Chats, Bildgenerierung und das Indexieren von Quellen für alle in der Organisation, bis das Kontingent zurückgesetzt wird. Ein Upgrade oder ein Guthabenpaket wirkt sofort.",
        manageButton: "Generierungen aufstocken",
      },
    },
    footer: (supportEmail) =>
      `Du erhältst diese E-Mail, weil du diese Organisation besitzt oder verwaltest. Fragen? Schreib uns an ${supportEmail}.`,
    logoAlt: "Scibly-Logo",
  },
} satisfies Record<Locale, AllowanceWarningMailMessages>;

export const publicSessionCeilingMailMessages = {
  en: {
    subject: "Your public courses are nearing this month's limit",
    preview: (orgName) =>
      `${orgName} has used most of this month's anonymous sessions`,
    heading: "Nearing the anonymous session limit",
    bodyIntro: (orgName, used, limit) =>
      `${orgName} has started ${used} of the ${limit} anonymous sessions included this billing period. Anonymous sessions are the visits your public course links receive from people without an account.`,
    consequence:
      "Once the limit is reached, your public links report the course as unavailable until the next billing period begins. Upgrading the plan raises the limit right away.",
    manageButton: "Review plan",
    footer: (supportEmail) =>
      `You're receiving this because you own or administer this organization. Questions? Contact us at ${supportEmail}.`,
    logoAlt: "Scibly logo",
  },
  de: {
    subject: "Deine öffentlichen Kurse nähern sich dem Monatslimit",
    preview: (orgName) =>
      `${orgName} hat die meisten anonymen Sitzungen dieses Monats verbraucht`,
    heading: "Limit für anonyme Sitzungen fast erreicht",
    bodyIntro: (orgName, used, limit) =>
      `${orgName} hat ${used} von ${limit} anonymen Sitzungen in dieser Abrechnungsperiode gestartet. Anonyme Sitzungen sind die Aufrufe deiner öffentlichen Kurslinks durch Personen ohne Konto.`,
    consequence:
      "Sobald das Limit erreicht ist, melden deine öffentlichen Links den Kurs bis zur nächsten Abrechnungsperiode als nicht verfügbar. Ein Upgrade erhöht das Limit sofort.",
    manageButton: "Tarif ansehen",
    footer: (supportEmail) =>
      `Du erhältst diese E-Mail, weil du diese Organisation besitzt oder verwaltest. Fragen? Schreib uns an ${supportEmail}.`,
    logoAlt: "Scibly-Logo",
  },
} satisfies Record<Locale, PublicSessionCeilingMailMessages>;
