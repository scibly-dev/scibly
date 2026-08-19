export type ComparisonDictionary = {
  title1: string;
  title2: string;
  table: {
    headers: {
      legacy: string;
      scibly: string;
    };
    rows: Array<{
      kind: string;
      label: string;
      legacy: string;
      scibly: string;
    }>;
  };
};
