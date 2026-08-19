type OpenSourceStep = {
  kind: string;
  label: string;
  caption: string;
  note: string;
};

export type OpenSourceDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions: {
    repo: string;
    selfHost: string;
  };
  licenseLabel: string;
  terminal: {
    transcriptLabel: string;
    stepsLabel: string;
  };
  steps: OpenSourceStep[];
};
