export const TYPE_TO_MAIL_MAP = {
  support: "Scibly Support <support@scibly.com>",
  noReply: "Scibly <team@scibly.com>",
  team: "Scibly Team <team@scibly.com>",
} as const;

export type SenderType = keyof typeof TYPE_TO_MAIL_MAP;
