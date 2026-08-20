export type AnalyticsSurface = "app" | "web";
export type AnalyticsEnv = "development" | "test" | "production";

/** Who the browser belongs to, on surfaces that know. Pseudonymous — the id and nothing else. */
export type AnalyticsIdentity = { userId: string };

export type ConsentLabels = {
  title: string;
  message: string;
  privacyPolicy: string;
  acceptAll: string;
  necessaryOnly: string;
  showDetails: string;
  hideDetails: string;
  savePreferences: string;
  necessaryTitle: string;
  necessaryDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
};
