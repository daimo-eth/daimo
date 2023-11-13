// Functional programming utilities.

/** In-memory cache a function. */
export function memoize<I, O>(func: (i: I) => O) {
  const cache = new Map<I, O>();
  return (i: I) => {
    if (cache.has(i)) return cache.get(i)!;
    const o = func(i);
    cache.set(i, o);
    return o;
  };
}
