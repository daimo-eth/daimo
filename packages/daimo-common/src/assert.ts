export function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg || "Assertion failed");
}

export function assertNotNull<T>(value: T | null | undefined, msg?: string): T {
  assert(value !== null && value !== undefined, msg);
  return value;
}
