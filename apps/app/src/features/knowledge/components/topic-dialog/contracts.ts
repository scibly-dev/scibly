export type Option = { id: string; label: string };

export const toggle = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((each) => each !== value)
    : [...values, value];
