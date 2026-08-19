import type { ReactElement } from "react";

import { db } from "@scibly/db";
import sendEmail from "@scibly/email/resend";
import { routes } from "@scibly/routes";
import { after } from "next/server";

import "server-only";

type NoticeSubject = {
  organizationName: string;
  url: string;
};

type OwnerNotice<Occasion> = {
  label: string;

  occasion: () => Promise<Occasion | null>;
  compose: (
    occasion: Occasion,
    organization: NoticeSubject,
  ) => { subject: string; react: ReactElement };
};

export async function notifyOwners<Occasion>(
  organizationId: string,
  notice: OwnerNotice<Occasion>,
): Promise<void> {
  try {
    const occasion = await notice.occasion();
    if (occasion === null) return;

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, slug: true },
    });
    if (!organization) return;

    const recipients = await db.member.findMany({
      where: {
        organizationId,
        role: "owner",
        user: { emailNotifications: true },
      },
      select: { user: { select: { email: true } } },
    });

    const mail = notice.compose(occasion, {
      organizationName: organization.name,
      url: routes.app.profile.org(organization.slug).billing,
    });

    await Promise.all(
      recipients.map((member) =>
        sendEmail({
          from: "noReply",
          to: member.user.email,
          subject: mail.subject,
          react: mail.react,
        }),
      ),
    );
  } catch (error) {
    console.error(
      `${notice.label} for organization ${organizationId} failed to send:`,
      error,
    );
  }
}

export function notifyAfterResponding(notify: () => Promise<void>): void {
  try {
    after(notify);
  } catch {
    void notify();
  }
}
