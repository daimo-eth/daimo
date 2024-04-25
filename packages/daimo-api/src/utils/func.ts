// Functional programming utilities.

/** In-memory cache a function. */
export function memoize<K, I, O>(
  func: (i: I) => O,
  keyFunc: (i: I) => K = (i) => i as any
) {
  const cache = new Map<K, O>();
  return (i: I) => {
    const k = keyFunc(i);
    if (cache.has(k)) return cache.get(k)!;
    const o = func(i);
    cache.set(k, o);
    return o;
  };
}

/**
 * Returns chunks of size n.
 * @param {Array<T>} array any array
 * @param {number} n size of chunk
 */
export function* chunks<T>(array: T[], n: number) {
  for (let i = 0; i < array.length; i += n) yield array.slice(i, i + n);
}
