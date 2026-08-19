import { defaultLocale, type Locale } from "@scibly/i18n/constants";
import { z } from "zod/v4";

import { containsBadWord } from "./bad-words";

type PasswordRuleMessages = {
  length: string;
  uppercase: string;
  lowercase: string;
  number: string;
  symbol: string;
};

type NameFieldMessages = {
  minLength: string;
  maxLength: string;
  lettersOnly: string;
};

type UsernameFieldMessages = {
  minLength: string;
  maxLength: string;
  allowedChars: string;
  profanity: string;
};

const passwordValidationMessages = {
  de: {
    length:
      "Das Passwort muss mindestens 8 und höchstens 100 Zeichen lang sein.",
    uppercase: "Das Passwort muss mindestens einen Großbuchstaben enthalten.",
    lowercase: "Das Passwort muss mindestens einen Kleinbuchstaben enthalten.",
    number: "Das Passwort muss mindestens eine Ziffer enthalten.",
    symbol: "Das Passwort muss mindestens ein Sonderzeichen enthalten.",
  },
  en: {
    length: "Password must be at least 8 and at most 100 characters",
    uppercase: "Password must contain at least one uppercase letter",
    lowercase: "Password must contain at least one lowercase letter",
    number: "Password must contain at least one number",
    symbol: "Password must contain at least one symbol",
  },
} satisfies Record<Locale, PasswordRuleMessages>;

const passwordRuleLabels = {
  de: {
    length: "Mindestens 8 Zeichen",
    uppercase: "Mindestens ein Großbuchstabe",
    lowercase: "Mindestens ein Kleinbuchstabe",
    number: "Mindestens eine Ziffer",
    symbol: "Mindestens ein Sonderzeichen",
  },
  en: {
    length: "At least 8 characters",
    uppercase: "At least one uppercase letter",
    lowercase: "At least one lowercase letter",
    number: "At least one number",
    symbol: "At least one special character",
  },
} satisfies Record<Locale, PasswordRuleMessages>;

const pickSupportedLocale = (locale: Locale): Locale =>
  locale === "en" ? "en" : "de";

const createPasswordLengthSchema = (locale: Locale) => {
  const m = passwordValidationMessages[pickSupportedLocale(locale)];
  return z
    .string()
    .refine((password) => password.length >= 8 && password.length <= 100, {
      message: m.length,
    });
};

const createPasswordUppercaseSchema = (locale: Locale) => {
  const m = passwordValidationMessages[pickSupportedLocale(locale)];
  return z.string().regex(/[A-Z]/, m.uppercase);
};

const createPasswordLowercaseSchema = (locale: Locale) => {
  const m = passwordValidationMessages[pickSupportedLocale(locale)];
  return z.string().regex(/[a-z]/, m.lowercase);
};

const createPasswordNumberSchema = (locale: Locale) => {
  const m = passwordValidationMessages[pickSupportedLocale(locale)];
  return z.string().regex(/[0-9]/, m.number);
};

const createPasswordSymbolSchema = (locale: Locale) => {
  const m = passwordValidationMessages[pickSupportedLocale(locale)];
  return z.string().regex(/[^A-Za-z0-9]/, m.symbol);
};

export const createPasswordSchema = (locale: Locale) =>
  z
    .string()
    .pipe(createPasswordLengthSchema(locale))
    .pipe(createPasswordUppercaseSchema(locale))
    .pipe(createPasswordLowercaseSchema(locale))
    .pipe(createPasswordNumberSchema(locale))
    .pipe(createPasswordSymbolSchema(locale));

type PasswordValidationRuleConfig = {
  id: string;
  label: string;
  validator: (password: string) => boolean;
};

export const getPasswordValidationRulesForLocale = (
  locale: Locale,
): PasswordValidationRuleConfig[] => {
  const L = passwordRuleLabels[pickSupportedLocale(locale)];
  const len = createPasswordLengthSchema(locale);
  const up = createPasswordUppercaseSchema(locale);
  const low = createPasswordLowercaseSchema(locale);
  const num = createPasswordNumberSchema(locale);
  const sym = createPasswordSymbolSchema(locale);
  return [
    {
      id: "length",
      label: L.length,
      validator: (password) => len.safeParse(password).success,
    },
    {
      id: "uppercase",
      label: L.uppercase,
      validator: (password) => up.safeParse(password).success,
    },
    {
      id: "lowercase",
      label: L.lowercase,
      validator: (password) => low.safeParse(password).success,
    },
    {
      id: "number",
      label: L.number,
      validator: (password) => num.safeParse(password).success,
    },
    {
      id: "special",
      label: L.symbol,
      validator: (password) => sym.safeParse(password).success,
    },
  ];
};

const nameFieldMessages = {
  de: {
    minLength: "Name muss aus min. 2 Buchstaben bestehen",
    maxLength: "Name darf höchstens 32 Zeichen lang sein",
    lettersOnly: "Name darf nur Buchstaben und Leerzeichen enthalten",
  },
  en: {
    minLength: "Name must be at least 2 characters",
    maxLength: "Name must be at most 32 characters",
    lettersOnly: "Name may only contain letters and spaces",
  },
} satisfies Record<Locale, NameFieldMessages>;

const usernameFieldMessages = {
  de: {
    minLength: "Benutzername muss aus min. 2 Zeichen bestehen",
    maxLength: "Benutzername darf höchstens 32 Zeichen lang sein",
    allowedChars:
      "Benutzername darf nur Buchstaben, Leerzeichen, Zahlen und Unterstriche enthalten",
    profanity: "Dieser Benutzername enthält unangemessene Ausdrücke",
  },
  en: {
    minLength: "Username must be at least 2 characters",
    maxLength: "Username must be at most 32 characters",
    allowedChars:
      "Username may only contain letters, spaces, numbers, and underscores",
    profanity: "This username contains inappropriate words",
  },
} satisfies Record<Locale, UsernameFieldMessages>;

const emailFieldMessages = {
  de: { invalid: "Bitte gib eine gültige E-Mail-Adresse ein" },
  en: { invalid: "Please enter a valid email address" },
} satisfies Record<Locale, { invalid: string }>;

const resetPasswordConfirmMessages = {
  de: { mismatch: "Die Passwörter stimmen nicht überein." },
  en: { mismatch: "Passwords do not match." },
} satisfies Record<Locale, { mismatch: string }>;

export const createNameSchema = (locale: Locale) => {
  const m = nameFieldMessages[pickSupportedLocale(locale)];
  return z
    .string()
    .trim()
    .min(2, m.minLength)
    .max(32, m.maxLength)
    .refine((name) => /^[a-zA-ZäöüÄÖÜ ]+$/.test(name), {
      message: m.lettersOnly,
    });
};

export const createUsernameSchema = (locale: Locale) => {
  const m = usernameFieldMessages[pickSupportedLocale(locale)];
  return z
    .string()
    .trim()
    .min(2, m.minLength)
    .max(32, m.maxLength)
    .refine((username) => /^[a-zA-Z0-9_äöüÄÖÜ ]+$/.test(username), {
      message: m.allowedChars,
    })
    .refine((username) => !containsBadWord(username), {
      message: m.profanity,
    });
};

export const createEmailSchema = (locale: Locale) =>
  z.email({
    message: emailFieldMessages[pickSupportedLocale(locale)].invalid,
  });

export const createResetPasswordWithConfirmationSchema = (locale: Locale) =>
  z
    .object({
      password: createPasswordSchema(locale),
      confirmPassword: createPasswordSchema(locale),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message:
        resetPasswordConfirmMessages[pickSupportedLocale(locale)].mismatch,
      path: ["confirmPassword"],
    });

const profileImageSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((image) => {
    try {
      const protocol = new URL(image).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Image must use an HTTP or HTTPS URL");

export const createUpdateUserSchema = (locale: Locale) =>
  z
    .object({
      name: createNameSchema(locale).optional(),
      username: createUsernameSchema(locale).optional(),
      image: profileImageSchema.nullable().optional(),
      emailNotifications: z.boolean().optional(),
      marketingNotifications: z.boolean().optional(),
    })
    .strict();

export const updateUserSchema = createUpdateUserSchema(defaultLocale);
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
