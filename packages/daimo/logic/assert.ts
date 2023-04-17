export function assert(condition: boolean, msg?: string): asserts condition {
  if (!condition) throw new Error(msg || "Assertion failed");
}
