import { headers } from "next/headers";

export function getReqLang(): string | null {
  return headers().get("accept-language");
}
