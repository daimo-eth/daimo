export function check(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Check failed");
  }
}
