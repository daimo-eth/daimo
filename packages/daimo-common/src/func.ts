import { assertNotNull } from "./assert";

// Functional programming utilities.

// Tries a function, returns the result or null on error.
export function tryOrNull<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export function tryOr<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

// No-op, wrap any function call to return void.
export function ignore(input: any): void {}

// Look-up table
export function lookup<T, V>(...items: [T, V][]): (item: T) => V {
  const map = new Map(items);
  return (item) => {
    const ret = map.get(item);
    return assertNotNull(ret, "lookup failed, can't find: " + item);
  };
}
