import { assert } from "@daimo/common";

/**
 * Lazily executes `fn` and caches the result ensuring only one execution at a time.
 *
 * `cacheTime` is duration in ms after cached value is considered expired,
 * and must be refreshed before it can be returned.
 *
 * `staleTime` is an optional duration that refreshes
 * the cache before it expires. Use it to avoid blocking after cache expires.
 * Must be smaller than `cacheTime`.
 *
 */
export function lazyCache<T>(
  fn: () => Promise<T>,
  cacheTime: number,
  staleTime = cacheTime
) {
  const undefinedCachedValue = Symbol();
  let currentPromise: Promise<T> | null = null;
  let cachedValue: typeof undefinedCachedValue | T = undefinedCachedValue;
  let cachedAt = -1;

  assert(cacheTime >= staleTime);

  return () => {
    const now = performance.now();

    // cache for the first time or when value becomes stale
    if (!currentPromise && now > cachedAt + staleTime) {
      currentPromise = fn();
      currentPromise
        .then((value) => {
          cachedValue = value;
          cachedAt = performance.now();
          currentPromise = null;
        })
        .catch((e) => {
          console.error("lazyCache error", e);

          cachedValue = undefinedCachedValue;
          cachedAt = -1;
          currentPromise = null;
        });
    }

    // fn is executing
    if (currentPromise) {
      // cache expired, waiting for current result
      if (currentPromise && now > cachedAt + cacheTime) {
        return currentPromise as Promise<T>;
      }

      // no cached value yet, wait fn to finish
      if (cachedValue === undefinedCachedValue) {
        return currentPromise as Promise<T>;
      }
    }

    // we have a cached value, return it
    return Promise.resolve(cachedValue as T);
  };
}
