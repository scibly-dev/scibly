import { type OrgBillingPage } from "@scibly/ee-organizations-billing/i18n/org-billing.types";

import { type AppRoutesPage } from "@/app/[lang]/i18n/app-routes.types";
import { type EditorUiPage } from "@/app/[lang]/i18n/editor-ui.types";
import { type AuthPage } from "@/features/auth/i18n/auth.types";
import { type UserSettingsPage } from "@/features/auth/settings/i18n/user-settings.types";
import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { type KnowledgeTranslations } from "@/features/knowledge/contracts";
import { type LearningPlayerTranslations } from "@/features/learning/course-player/ui/player/i18n/learning-player.types";
import { type LearnDashboardTranslations } from "@/features/learning/i18n/learning.types";
import { type PublicCourseTranslations } from "@/features/learning/public-course/i18n/public-course.types";
import { type NotebookTranslations } from "@/features/notebook/i18n/notebook.types";
import { type DashboardPage } from "@/features/organizations/creation/i18n/dashboard.types";
import { type InvitationsPageTranslations } from "@/features/organizations/invitations/i18n/invitations.types";
import { type OrgMembersTranslations } from "@/features/organizations/members/i18n/org-members.types";
import { type OnboardingPage } from "@/features/organizations/onboarding/i18n/onboarding.types";
import { type OrgSettingsPage } from "@/features/organizations/settings/i18n/org-settings.types";

export type Dictionary = {
  page: {
    appRoutes: AppRoutesPage;
    editorUi: EditorUiPage;
    auth: AuthPage;
    dashboard: DashboardPage;
    userSettings: UserSettingsPage;
    orgSettings: OrgSettingsPage;
    orgBilling: OrgBillingPage;
    orgMembers: OrgMembersTranslations;
    learningPlayer: LearningPlayerTranslations;
    publicCourse: PublicCourseTranslations;
    learn: LearnDashboardTranslations;
    invitations: InvitationsPageTranslations;
    onboarding: OnboardingPage;
    courses: CoursesTranslations;
    notebook: NotebookTranslations;
    knowledge: KnowledgeTranslations;
  };
};

export type Pages = keyof Dictionary["page"];

export type DictionaryPages = Dictionary["page"];
