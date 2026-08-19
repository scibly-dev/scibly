export const assertExhaustive = (value: never): never => {
  let toPrint: string;
  try {
    toPrint = JSON.stringify(value);
  } catch {
    toPrint = String(value);
  }
  throw new Error(
    `Unexpected value "${toPrint}" (type: ${typeof value}). Should have been type never`,
  );
};
