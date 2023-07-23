export function maybe<U, V>(func: (t: U) => V, u?: U | null): V | null {
  if (u == null) return null;
  return func(u);
}
