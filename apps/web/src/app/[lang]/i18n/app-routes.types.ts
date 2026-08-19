export type AppRoutesPage = {
  loadingPage: string;
  loadingEditor: string;
  loadingWorksheet: string;
  loadingWorksheets: string;
  loadingSettings: string;
};

export type AppRouteLoadingVariant = keyof Pick<
  AppRoutesPage,
  | "loadingPage"
  | "loadingEditor"
  | "loadingWorksheet"
  | "loadingWorksheets"
  | "loadingSettings"
>;
