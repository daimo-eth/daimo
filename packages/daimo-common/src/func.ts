// Functional programming utilities.

import { assertNotNull } from "./assert";

// No-op, wrap any function call to return void.
export function ignore(input: any): void {}

export function lookup<T, V>(...items: [T, V][]): (item: T) => V {
  const map = new Map(items);
  return (item) => {
    const ret = map.get(item);
    return assertNotNull(ret, "lookup failed, can't find: " + item);
  };
}
