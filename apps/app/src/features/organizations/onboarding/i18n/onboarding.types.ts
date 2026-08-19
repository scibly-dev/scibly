export type OnboardingPage = {
  createOrg: {
    eyebrow: string;
    /** Ends in a space — the accent word is appended in the serif face. */
    title: string;
    titleAccent: string;
    subtitle: string;
    logoLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    slugLabel: string;
    slugPlaceholder: string;
    /** What the organization will hold, previewed inside the card. */
    contents: {
      notebooks: string;
      courses: string;
      team: string;
    };
    submit: string;
    submitting: string;
    skip: string;
    errorToast: string;
  };
  invite: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    skip: string;
  };
  plans: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    /** The trial balance, presented as a voucher stub beside its number. */
    credits: {
      eyebrow: string;
      unit: string;
      headline: string;
      note: string;
      /** Stands in while the balance is still being granted. */
      pending: string;
    };
    continue: string;
  };
};
