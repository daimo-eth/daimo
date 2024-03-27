// Retries a function up to a maximum number of times, with exponential backoff.
// Current settings, max total wait time is ~10 seconds.
export async function retryBackoff<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const retryCount = 5;
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i <= retryCount) {
        const sleepMs = Math.min(2000, 250 * 2 ** i);
        console.log(
          `[RETRY] ${name} sleeping ${sleepMs}ms after try ${i}, error: ${e}`
        );
        await new Promise((r) => setTimeout(r));
      } else {
        console.warn(`[RETRY] ${name} QUITTING after try ${i}, error: ${e}`);
        break;
      }
    }
  }
  // TODO: add performance logging
  throw new Error(`too many retries: ${name}`);
}
