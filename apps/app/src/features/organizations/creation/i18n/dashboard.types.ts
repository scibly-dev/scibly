export type DashboardPage = {
  title: string;
  subtitle: string;
  createOrg: {
    heading: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    slugLabel: string;
    slugPlaceholder: string;
    slugHint: string;
    submit: string;
    submitting: string;
    successToast: string;
    errorToast: string;
    slugTaken: string;
  };
  orgReady: {
    heading: string;
    description: string;
    orgLabel: string;
    goToEditor: string;
  };
};
