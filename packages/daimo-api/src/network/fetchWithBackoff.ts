import { retryBackoff } from "@daimo/common";

// Wrap fetch() using retryBackoff, with a 1s timeout on each fetch attempt.
// Max total time: ~6s if all 3 attempts time out.
export async function fetchWithBackoff(
  url: string | URL,
  init?: RequestInit,
  maxRetries = 3
) {
  return retryBackoff(
    `fetchWithBackoff(${url})`,
    async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 1000);
      const reqInit = { ...init, signal: controller.signal };
      return await fetch(url, reqInit);
    },
    maxRetries
  );
}
