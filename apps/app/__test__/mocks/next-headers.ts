// Mock for next/headers
export const headers = () => new Headers();
export const cookies = () => ({
  get: () => undefined,
  getAll: () => [],
  set: () => {},
  delete: () => {},
  has: () => false,
});
