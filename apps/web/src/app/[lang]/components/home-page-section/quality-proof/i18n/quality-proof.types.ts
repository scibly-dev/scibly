export type QualityProofInput = {
  label: string;
  detail: string;
};

export type QualityProof = {
  kind: string;
  label: string;
};

export type QualityProofLayer = {
  title: string;
  body: string;
  proof?: QualityProof;
};

export type QualityProofDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  inputLabel: string;
  inputTitle: string;

  sourceSamples: string[];
  inputs: QualityProofInput[];
  coreLabel: string;
  qualityLayers: QualityProofLayer[];
  output: {
    label: string;
    title: string;
    body: string;
    status: string;
  };
  differentiation: {
    title: string;
    body: string;
  };
  cta: {
    notebook: {
      eyebrow: string;
      title: string;
      body: string;
      label: string;
    };
    course: {
      eyebrow: string;
      title: string;
      body: string;
      label: string;
    };
  };
};
