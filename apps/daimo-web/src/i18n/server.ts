import { headers } from "next/headers";

export function getReqLang(): string | null {
  return headers().get("accept-language");
}

export function getReqHeaders(): Record<string, string> {
  return Object.fromEntries(headers().entries());
}
