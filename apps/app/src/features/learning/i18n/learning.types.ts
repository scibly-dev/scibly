import type { CertificateTranslations } from "../certificates/i18n/certificates.types";
import type { PlayerStateTranslations } from "../course-player/i18n/player-states.types";
import type { EnrolledCoursesTranslations } from "../dashboard/i18n/enrolled-courses.types";
import type { DashboardOverviewTranslations } from "../dashboard/overview/i18n/dashboard-overview.types";
import type { DashboardShellTranslations } from "../dashboard/shell/i18n/dashboard-shell.types";

export type LearnDashboardTranslations = DashboardShellTranslations &
  DashboardOverviewTranslations &
  EnrolledCoursesTranslations &
  CertificateTranslations &
  PlayerStateTranslations;
