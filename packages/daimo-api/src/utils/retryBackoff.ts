export async function retryBackoff<T>(
  name: string,
  fn: () => Promise<T>,
  retryCount: number = 10
): Promise<T> {
  for (let i = 1; i <= retryCount; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`[CHAIN] ${name} retry ${i} after error: ${e}`);
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  // TODO: add performance logging
  throw new Error(`too many retries: ${name}`);
}
