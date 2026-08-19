import type {
  Prisma,
  PrismaClient,
} from "../../schema/generated/prisma/client.js";

import { provisionOrganizationPlan } from "../../src/provision-organization.js";

interface SeedOrgConfig {
  orgSlug: string;
  orgName: string;
  orgId: string;
  ownerId: string;
  userPrefix: string;
  numUsers: number;
  numCourses: number;
  hashedPassword: string;
  createOwnerUser?: boolean;
  isE2E?: boolean;
}

const WRONG_INPUT_ANSWERS = [
  "Wrong Answer",
  "Incorrect response",
  "I don't know",
  "Maybe 42?",
  "Placeholder answer",
  "Not sure about this",
  "Not correct",
  "Oops, wrong answer",
  "Skipped question",
  "Unknown concept",
  "Invalid reply",
  "Testing output",
  "I need a hint",
  "None of the above",
];

export const generateOrgData = async (
  prisma: PrismaClient,
  config: SeedOrgConfig,
) => {
  const {
    orgSlug,
    orgName,
    orgId,
    ownerId,
    userPrefix,
    numUsers,
    numCourses,
    hashedPassword,
    createOwnerUser,
  } = config;

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (existingOrg) {
    console.log(`Clearing existing organization and users for ${orgSlug}...`);
    await prisma.organization.delete({ where: { slug: orgSlug } });

    await prisma.user.deleteMany({
      where: {
        id: { startsWith: `${userPrefix}_` },
      },
    });

    await prisma.scene.deleteMany({
      where: {
        id: { startsWith: `scene_${orgId}_` },
      },
    });

    if (createOwnerUser) {
      await prisma.user.delete({ where: { id: ownerId } }).catch(() => {});
    }
  }

  await prisma.organization.create({
    data: {
      id: orgId,
      name: orgName,
      slug: orgSlug,
      createdAt: new Date(),
    },
  });

  await provisionOrganizationPlan(prisma, orgId, "INTERNAL");

  console.log(`✓ Organization seeded: ${orgSlug}`);

  console.log(`Generating ${numUsers} members...`);

  const usersToCreate = [];
  const membersToCreate = [];
  const accountsToCreate = [];
  const invitationsToCreate = [];

  if (createOwnerUser) {
    usersToCreate.push({
      id: ownerId,
      name: `${userPrefix} Owner`,
      email: `${userPrefix}1@scibly.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    accountsToCreate.push({
      id: `acc_${ownerId}`,
      accountId: ownerId,
      providerId: "credential",
      password: hashedPassword,
      userId: ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  membersToCreate.push({
    id: `mem_${orgId}_owner`,
    organizationId: orgId,
    userId: ownerId,
    role: "owner",
    createdAt: new Date(),
  });

  for (let i = 2; i <= numUsers; i++) {
    const userId = `${userPrefix}_${i}`;
    const role = i <= 5 ? "admin" : "member";

    usersToCreate.push({
      id: userId,
      name: `${userPrefix} User ${i}`,
      email: `${userPrefix}${i}@scibly.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    accountsToCreate.push({
      id: `acc_${userPrefix}_${i}`,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    membersToCreate.push({
      id: `mem_${userPrefix}_${i}`,
      organizationId: orgId,
      userId: userId,
      role: role,
      createdAt: new Date(),
    });
  }

  const numInvitations = Math.min(10, numUsers);
  for (let i = 1; i <= numInvitations; i++) {
    const role = i <= 2 ? "admin" : "member";
    invitationsToCreate.push({
      id: `inv_${userPrefix}_${i}`,
      organizationId: orgId,
      email: `invited_${userPrefix}_${i}@example.com`,
      role: role,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 500000000),
      inviterId: ownerId,
    });
  }

  if (usersToCreate.length > 0) {
    await prisma.user.createMany({ data: usersToCreate });
    await prisma.account.createMany({ data: accountsToCreate });
  }

  await prisma.member.createMany({ data: membersToCreate });

  if (invitationsToCreate.length > 0) {
    await prisma.invitation.createMany({ data: invitationsToCreate });
  }

  console.log(`✓ Members seeded`);

  const ownerName =
    (
      await prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true },
      })
    )?.name ?? `${userPrefix} Owner`;

  if (numCourses === 0) return;

  console.log(`Generating ${numCourses} courses...`);

  const coursesToCreate = [];
  const lessonsToCreate = [];

  const scenesToCreate: (Prisma.SceneCreateManyInput & { id: string })[] = [];
  const enrollmentsToCreate: Prisma.CourseEnrollmentCreateManyInput[] = [];
  const sceneProgressesToCreate: Prisma.SceneProgressCreateManyInput[] = [];
  const sceneAnalyticsToCreate: Prisma.SceneAnalyticsCreateManyInput[] = [];
  const certificatesToCreate: Prisma.CertificateCreateManyInput[] = [];
  const anonymousSessionsToCreate: Prisma.AnonymousCourseSessionCreateManyInput[] =
    [];

  const categories = [
    "Compliance",
    "Engineering",
    "Soft Skills",
    "Onboarding",
    "Marketing",
  ];
  const statuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

  for (let i = 1; i <= numCourses; i++) {
    const courseId = `course_${orgId}_${i}`;
    const passingScorePct = config.isE2E
      ? null
      : i % 3 === 0
        ? null
        : i % 2 === 0
          ? 80
          : 70;
    const maxTries = config.isE2E ? null : i % 3 === 0 ? null : 3;
    const allowAnonymous = config.isE2E ? false : i % 2 === 0;

    coursesToCreate.push({
      id: courseId,
      organizationId: orgId,
      title: `Course ${i}: ${categories[i % categories.length]} Fundamentals`,
      description: `This is a highly detailed description for Course ${i}. It covers everything you need to know about ${categories[i % categories.length]}.`,
      category: categories[i % categories.length],
      tags: [
        "Beginner",
        "Required",
        categories[i % categories.length]!.toLowerCase().replace(" ", "-"),
      ],
      passingScorePct,
      maxTries,
      allowAnonymous,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const numLessons = numCourses > 1 ? Math.floor(Math.random() * 5) + 3 : 2;
    for (let j = 1; j <= numLessons; j++) {
      const lessonId = `lesson_${orgId}_${i}_${j}`;
      lessonsToCreate.push({
        id: lessonId,
        courseId: courseId,
        title: `Lesson ${j}: Introduction to topic ${j}`,
        description: `This lesson covers the basic concepts of part ${j} of the course.`,
        estimatedTimeToCompleteMinutes: config.isE2E
          ? 21
          : Math.floor(Math.random() * 20) + 5,
        order: j - 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const numScenes = numCourses > 1 ? Math.floor(Math.random() * 4) + 2 : 2;
      for (let k = 1; k <= numScenes; k++) {
        const draftSceneId = `scene_${orgId}_${i}_${j}_${k}_draft`;

        scenesToCreate.push({
          id: draftSceneId,
          lessonId,
          order: k - 1,
          title: "New Scene",
          sp: 10,
          documentState: config.isE2E ? Buffer.from("<p></p>") : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const numEnrolled = Math.min(Math.floor(Math.random() * 16) + 5, numUsers);
    const enrolledUsers = new Set<number>();

    if (numUsers > 1) {
      while (enrolledUsers.size < numEnrolled) {
        enrolledUsers.add(Math.floor(Math.random() * numUsers) + 1);
      }
    } else {
      enrolledUsers.add(1);
    }

    for (const userNum of Array.from(enrolledUsers)) {
      const actualUserId = userNum === 1 ? ownerId : `${userPrefix}_${userNum}`;
      const userName =
        actualUserId === ownerId ? ownerName : `${userPrefix} User ${userNum}`;
      const enrollmentId = `enrollment_${orgId}_${i}_${userNum}`;

      if (config.isE2E) {
        enrollmentsToCreate.push({
          id: enrollmentId,
          courseId: courseId,
          organizationId: orgId,
          userId: actualUserId,
          courseVersionId: `version_${orgId}_${i}`,
          status: "NOT_STARTED",
          triesUsed: 0,
          lastActive: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const status = statuses[Math.floor(Math.random() * statuses.length)]!;

        let triesUsed = 0;
        if (status === "COMPLETED") {
          const r = Math.random();
          triesUsed = r < 0.75 ? 1 : r < 0.95 ? 2 : 3;
        } else if (status === "IN_PROGRESS") {
          triesUsed = Math.random() > 0.7 ? 1 : 0;
        }

        const enrollmentCreatedAt = new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        );
        let lastActive = new Date(
          enrollmentCreatedAt.getTime() +
            Math.random() * (Date.now() - enrollmentCreatedAt.getTime()),
        );
        let completedAt = status === "COMPLETED" ? lastActive : null;

        enrollmentsToCreate.push({
          id: enrollmentId,
          courseId: courseId,
          organizationId: orgId,
          userId: actualUserId,
          courseVersionId: `version_${orgId}_${i}`,
          status: status,
          triesUsed: triesUsed,
          lastActive: status !== "NOT_STARTED" ? lastActive : null,
          completedAt: completedAt,
          createdAt: enrollmentCreatedAt,
          updatedAt: lastActive,
        });

        if (status !== "NOT_STARTED") {
          const maxAttempt =
            status === "IN_PROGRESS" ? triesUsed + 1 : triesUsed;
          let finalAttemptEarnedSp = 0;
          let finalAttemptPassed = false;

          for (let attemptNum = 1; attemptNum <= maxAttempt; attemptNum++) {
            const isCurrentAttempt =
              attemptNum === maxAttempt && status === "IN_PROGRESS";
            const isPassedAttempt =
              !isCurrentAttempt &&
              (attemptNum < maxAttempt ? false : Math.random() > 0.15);

            let attemptEarnedSp = 0;

            const progressPercent = isCurrentAttempt
              ? Math.random() * 0.7 + 0.1
              : 1.0;
            const completedLessonsCount = Math.max(
              1,
              Math.floor(numLessons * progressPercent),
            );

            for (let j = 1; j <= numLessons; j++) {
              const lessonId = `lesson_${orgId}_${i}_${j}`;

              let lessonStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
                "COMPLETED";
              if (isCurrentAttempt) {
                if (j < completedLessonsCount) {
                  lessonStatus = "COMPLETED";
                } else if (j === completedLessonsCount) {
                  lessonStatus = "IN_PROGRESS";
                } else {
                  lessonStatus = "NOT_STARTED";
                }
              }

              if (lessonStatus === "NOT_STARTED") continue;

              const lessonScenes = scenesToCreate.filter(
                (s) => s.lessonId === lessonId,
              );

              for (let k = 0; k < lessonScenes.length; k++) {
                const scene = lessonScenes[k]!;

                let sceneStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
                  "COMPLETED";
                if (lessonStatus === "IN_PROGRESS") {
                  sceneStatus = k === 0 ? "IN_PROGRESS" : "NOT_STARTED";
                }

                if (sceneStatus === "NOT_STARTED") continue;

                if (sceneStatus === "COMPLETED") {
                  const mcCorrect = isPassedAttempt || Math.random() > 0.5;
                  const inputCorrect =
                    isPassedAttempt ||
                    (mcCorrect ? false : Math.random() > 0.5);
                  const totalSpEarned =
                    (mcCorrect ? 5 : 0) + (inputCorrect ? 5 : 0);

                  attemptEarnedSp += totalSpEarned;

                  const gradedBlocks = [
                    {
                      blockId: `block_mc_${scene.id}`,
                      blockType: "custom-multiple-choice",
                      achievedPoints: mcCorrect ? 1.0 : 0.0,
                      maxPoints: 1.0,
                      spEarned: mcCorrect ? 5 : 0,
                      learnerAnswer: mcCorrect ? ["choice-1"] : ["choice-2"],
                    },
                    {
                      blockId: `block_input_${scene.id}`,
                      blockType: "custom-input-field",
                      achievedPoints: inputCorrect ? 1.0 : 0.0,
                      maxPoints: 1.0,
                      spEarned: inputCorrect ? 5 : 0,
                      learnerAnswer: inputCorrect
                        ? "Correct Answer"
                        : WRONG_INPUT_ANSWERS[
                            (userNum + attemptNum + j + k) %
                              WRONG_INPUT_ANSWERS.length
                          ],
                    },
                  ];

                  sceneAnalyticsToCreate.push({
                    id: `sa_enr_${orgId}_${i}_${userNum}_${j}_${k}_${attemptNum}`,
                    enrollmentId: enrollmentId,
                    anonymousSessionId: null,
                    lessonId: lessonId,
                    sceneId: scene.id,
                    spEarned: totalSpEarned,
                    gradedBlocks,
                    attempt: attemptNum,
                    completedAt: isCurrentAttempt
                      ? new Date(lastActive.getTime() - Math.random() * 3600000)
                      : new Date(
                          enrollmentCreatedAt.getTime() +
                            (lastActive.getTime() -
                              enrollmentCreatedAt.getTime()) *
                              (j / numLessons),
                        ),
                    createdAt: enrollmentCreatedAt,
                  });

                  if (attemptNum === maxAttempt) {
                    sceneProgressesToCreate.push({
                      id: `scene_progress_${orgId}_${i}_${j}_${k}_${userNum}`,
                      enrollmentId: enrollmentId,
                      lessonId: lessonId,
                      sceneId: scene.id,
                      status: "COMPLETED",
                      timeSpentSeconds: Math.floor(Math.random() * 300) + 60,
                      completedAt: isCurrentAttempt
                        ? new Date(
                            lastActive.getTime() - Math.random() * 3600000,
                          )
                        : completedAt,
                      spEarned: totalSpEarned,
                      createdAt: enrollmentCreatedAt,
                      updatedAt: lastActive,
                    });
                  }
                } else if (
                  sceneStatus === "IN_PROGRESS" &&
                  attemptNum === maxAttempt
                ) {
                  sceneProgressesToCreate.push({
                    id: `scene_progress_${orgId}_${i}_${j}_${k}_${userNum}`,
                    enrollmentId: enrollmentId,
                    lessonId: lessonId,
                    sceneId: scene.id,
                    status: "IN_PROGRESS",
                    timeSpentSeconds: Math.floor(Math.random() * 60) + 10,
                    completedAt: null,
                    spEarned: 0,
                    createdAt: enrollmentCreatedAt,
                    updatedAt: lastActive,
                  });
                }
              }
            }

            if (attemptNum === maxAttempt) {
              finalAttemptEarnedSp = attemptEarnedSp;
              finalAttemptPassed = isPassedAttempt;
            }
          }

          if (status === "COMPLETED" && finalAttemptPassed) {
            certificatesToCreate.push({
              id: `cert_${enrollmentId}`,
              enrollmentId: enrollmentId,
              courseVersionId: `version_${orgId}_${i}`,
              userId: actualUserId,
              organizationId: orgId,
              userName: userName,
              courseName: `Course ${i}: ${categories[i % categories.length]} Fundamentals`,
              versionNumber: 1,
              completedAt: completedAt!,
              totalSpEarned: finalAttemptEarnedSp,
              createdAt: completedAt!,
            });
          }
        }
      }
    }

    if (!config.isE2E && allowAnonymous) {
      const numAnon = Math.floor(Math.random() * 8) + 5;
      for (let anonNum = 1; anonNum <= numAnon; anonNum++) {
        const anonymousSessionId = `anon_sess_${orgId}_${i}_${anonNum}`;
        const anonymousId = `anon_user_${orgId}_${i}_${anonNum}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)]!;

        let triesUsed = 0;
        if (status === "COMPLETED") {
          triesUsed = Math.random() > 0.8 ? 2 : 1;
        } else if (status === "IN_PROGRESS") {
          triesUsed = Math.random() > 0.8 ? 1 : 0;
        }

        const startedAt = new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        );
        let lastActive = new Date(
          startedAt.getTime() +
            Math.random() * (Date.now() - startedAt.getTime()),
        );
        let completedAt = status === "COMPLETED" ? lastActive : null;

        const maxAttempt = status === "IN_PROGRESS" ? triesUsed + 1 : triesUsed;
        let finalAttemptEarnedSp = 0;
        let finalAttemptPossibleSp = 0;

        for (let attemptNum = 1; attemptNum <= maxAttempt; attemptNum++) {
          const isCurrentAttempt =
            attemptNum === maxAttempt && status === "IN_PROGRESS";
          const isPassedAttempt =
            !isCurrentAttempt &&
            (attemptNum < maxAttempt ? false : Math.random() > 0.2);

          let attemptEarnedSp = 0;
          let attemptPossibleSp = 0;

          const progressPercent = isCurrentAttempt
            ? Math.random() * 0.7 + 0.1
            : 1.0;
          const completedLessonsCount = Math.max(
            1,
            Math.floor(numLessons * progressPercent),
          );

          for (let j = 1; j <= numLessons; j++) {
            const lessonId = `lesson_${orgId}_${i}_${j}`;

            let lessonStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
              "COMPLETED";
            if (isCurrentAttempt) {
              if (j < completedLessonsCount) {
                lessonStatus = "COMPLETED";
              } else if (j === completedLessonsCount) {
                lessonStatus = "IN_PROGRESS";
              } else {
                lessonStatus = "NOT_STARTED";
              }
            }

            if (lessonStatus === "NOT_STARTED") continue;

            const lessonScenes = scenesToCreate.filter(
              (s) => s.lessonId === lessonId,
            );
            for (let k = 0; k < lessonScenes.length; k++) {
              const scene = lessonScenes[k]!;

              let sceneStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
                "COMPLETED";
              if (lessonStatus === "IN_PROGRESS") {
                sceneStatus = k === 0 ? "IN_PROGRESS" : "NOT_STARTED";
              }

              if (sceneStatus !== "COMPLETED") continue;

              const mcCorrect = isPassedAttempt || Math.random() > 0.5;
              const inputCorrect =
                isPassedAttempt || (mcCorrect ? false : Math.random() > 0.5);
              const totalSpEarned =
                (mcCorrect ? 5 : 0) + (inputCorrect ? 5 : 0);

              attemptEarnedSp += totalSpEarned;
              attemptPossibleSp += 10;

              const gradedBlocks = [
                {
                  blockId: `block_mc_${scene.id}`,
                  blockType: "custom-multiple-choice",
                  achievedPoints: mcCorrect ? 1.0 : 0.0,
                  maxPoints: 1.0,
                  spEarned: mcCorrect ? 5 : 0,
                  learnerAnswer: mcCorrect ? ["choice-1"] : ["choice-2"],
                },
                {
                  blockId: `block_input_${scene.id}`,
                  blockType: "custom-input-field",
                  achievedPoints: inputCorrect ? 1.0 : 0.0,
                  maxPoints: 1.0,
                  spEarned: inputCorrect ? 5 : 0,
                  learnerAnswer: inputCorrect
                    ? "Correct Answer"
                    : WRONG_INPUT_ANSWERS[
                        (anonNum + attemptNum + j + k) %
                          WRONG_INPUT_ANSWERS.length
                      ],
                },
              ];

              sceneAnalyticsToCreate.push({
                id: `sa_anon_${orgId}_${i}_${anonNum}_${j}_${k}_${attemptNum}`,
                enrollmentId: null,
                anonymousSessionId: anonymousSessionId,
                lessonId: lessonId,
                sceneId: scene.id,
                spEarned: totalSpEarned,
                gradedBlocks,
                attempt: attemptNum,
                completedAt: isCurrentAttempt
                  ? new Date(lastActive.getTime() - Math.random() * 3600000)
                  : new Date(
                      startedAt.getTime() +
                        (lastActive.getTime() - startedAt.getTime()) *
                          (j / numLessons),
                    ),
                createdAt: startedAt,
              });
            }
          }

          if (attemptNum === maxAttempt) {
            finalAttemptEarnedSp = attemptEarnedSp;
            finalAttemptPossibleSp = attemptPossibleSp;
          }
        }

        const scorePct =
          finalAttemptPossibleSp > 0
            ? Math.round((finalAttemptEarnedSp / finalAttemptPossibleSp) * 100)
            : 0;

        anonymousSessionsToCreate.push({
          id: anonymousSessionId,
          anonymousId: anonymousId,
          courseId: courseId,
          courseVersionId: `version_${orgId}_${i}`,
          status: status,
          totalSpEarned: status === "NOT_STARTED" ? 0 : finalAttemptEarnedSp,
          scorePct: status === "COMPLETED" ? scorePct : null,
          triesUsed: triesUsed,
          startedAt: startedAt,
          completedAt: completedAt,
          createdAt: startedAt,
          updatedAt: lastActive,
        });
      }
    }
  }

  await prisma.course.createMany({ data: coursesToCreate });
  await prisma.lesson.createMany({ data: lessonsToCreate });
  await prisma.scene.createMany({ data: scenesToCreate });

  const e2ePublishedAt = new Date(Date.now() - 60_000);
  const versionsToCreate = coursesToCreate.map((c) => ({
    id: `version_${c.id.replace("course_", "")}`,
    courseId: c.id,
    version: 1,
    publishedById: ownerId,
    publishedAt: config.isE2E ? e2ePublishedAt : new Date(),
    superseded: false,
  }));
  await prisma.courseVersion.createMany({ data: versionsToCreate });

  const publishedLessonsToCreate = [];
  const publishedScenesToCreate = [];

  for (const version of versionsToCreate) {
    const courseLessons = lessonsToCreate.filter(
      (l) => l.courseId === version.courseId,
    );
    for (const lesson of courseLessons) {
      const publishedLessonId = `pub_${lesson.id}`;
      publishedLessonsToCreate.push({
        ...lesson,
        id: publishedLessonId,
        courseVersionId: version.id,
        sourceLessonId: lesson.id,
      });

      const lessonScenes = scenesToCreate.filter(
        (s) => s.lessonId === lesson.id,
      );
      for (const scene of lessonScenes) {
        publishedScenesToCreate.push({
          ...scene,
          id: `pub_${scene.id}`,
          lessonId: publishedLessonId,
          courseVersionId: version.id,
          sourceSceneId: scene.id,
          learnerContent: {
            type: "doc",
            content: [{ type: "paragraph" }],
          },
          gradingManifest: [],

          maxSp: scene.sp,
        });
      }
    }
  }

  await prisma.lesson.createMany({ data: publishedLessonsToCreate });
  await prisma.scene.createMany({ data: publishedScenesToCreate });

  const sceneProgresses = sceneProgressesToCreate.map((progress) => ({
    ...progress,
    sceneId: `pub_${progress.sceneId}`,
    lessonId: `pub_${progress.lessonId}`,
  }));

  const sceneAnalytics = sceneAnalyticsToCreate.map((sa) => ({
    ...sa,
    sceneId: `pub_${sa.sceneId}`,
    lessonId: `pub_${sa.lessonId}`,
  }));

  await prisma.courseEnrollment.createMany({ data: enrollmentsToCreate });
  if (anonymousSessionsToCreate.length > 0) {
    await prisma.anonymousCourseSession.createMany({
      data: anonymousSessionsToCreate,
    });
  }
  await prisma.sceneProgress.createMany({ data: sceneProgresses });

  if (sceneAnalytics.length > 0) {
    await prisma.sceneAnalytics.createMany({ data: sceneAnalytics });
  }
  if (certificatesToCreate.length > 0) {
    await prisma.certificate.createMany({ data: certificatesToCreate });
  }

  console.log(
    `✓ ${numCourses} courses with lessons, scenes, and enrollments seeded`,
  );
};
