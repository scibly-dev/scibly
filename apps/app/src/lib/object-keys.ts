// SAFETY: lib.d.ts widens Object.keys to string[] since a value can carry keys its
// type never declared; every caller here passes an object literal or an owned Record.
export const objectKeys = <T extends object>(object: T): (keyof T)[] =>
  Object.keys(object) as (keyof T)[];
