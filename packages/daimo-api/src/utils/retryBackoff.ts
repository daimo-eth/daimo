// Retries a function up to a maximum number of times, with exponential backoff.
// Current settings, max total wait time is ~10 seconds.
export async function retryBackoff<T>(
  name: string,
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i <= maxRetries) {
        const sleepMs = Math.min(2000, 250 * 2 ** i);
        console.log(
          `[RETRY] ${name} sleeping ${sleepMs}ms after try ${i}, error: ${e}`
        );
        await new Promise((r) => setTimeout(r, sleepMs));
      } else {
        console.warn(`[RETRY] ${name} QUITTING after try ${i}, error: ${e}`);
        break;
      }
    }
  }
  // TODO: add performance logging
  throw new Error(`too many retries: ${name}`);
}
