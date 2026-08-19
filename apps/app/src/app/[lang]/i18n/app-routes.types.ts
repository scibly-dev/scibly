export type AppRoutesPage = {
  brokenLinkError: string;
  dashboardTitle: string;

  loadingPage: string;
  loadingEditor: string;
  loadingWorksheet: string;
  loadingWorksheets: string;
  loadingSettings: string;
  errorBoundaryTitle: string;
  errorBoundaryRetryLabel: string;
};

export type AppRouteLoadingVariant = keyof Pick<
  AppRoutesPage,
  | "loadingPage"
  | "loadingEditor"
  | "loadingWorksheet"
  | "loadingWorksheets"
  | "loadingSettings"
>;
