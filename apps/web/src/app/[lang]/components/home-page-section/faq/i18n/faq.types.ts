export type FaqItem = {
  id: string;
  q: string;
  a: string;
};

export type FaqDictionary = {
  eyebrow: string;
  title: string;
  subtitle: string;
  questions: FaqItem[];
};
