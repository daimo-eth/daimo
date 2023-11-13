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
