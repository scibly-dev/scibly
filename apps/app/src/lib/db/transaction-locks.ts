import type { Prisma } from "@scibly/db";

type TransactionClient = Prisma.TransactionClient;

async function acquireTransactionLock(
  tx: TransactionClient,
  scope: "anonymous-attempt" | "enrollment-attempt" | "notebook-course-link",
  resource: string,
) {
  const key = `${scope}:${resource}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

export function lockEnrollmentAttempt(
  tx: TransactionClient,
  enrollmentId: string,
) {
  return acquireTransactionLock(tx, "enrollment-attempt", enrollmentId);
}

export function lockAnonymousAttempt(
  tx: TransactionClient,
  anonymousId: string,
  courseVersionId: string,
) {
  return acquireTransactionLock(
    tx,
    "anonymous-attempt",
    `${anonymousId}:${courseVersionId}`,
  );
}

export function lockNotebookCourseLink(
  tx: TransactionClient,
  notebookId: string,
) {
  return acquireTransactionLock(tx, "notebook-course-link", notebookId);
}
