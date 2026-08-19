export type ComplianceDictionary = {
  eyebrow: string;
  title: string;
  titleEmphasis: string;
  subtitle: string;
  registry: {
    summary: string;
  };
  controls: Array<{
    kind: string;
    value: string;
    label: string;
    detail: string;
  }>;
};
