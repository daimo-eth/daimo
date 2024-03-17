import { assert } from "@daimo/common";

const publicUrl =
  process.env.NEXT_PUBLIC_URL || `https://${process.env.VERCEL_URL}`;

export function getAbsoluteUrl(path: string) {
  assert(publicUrl !== "https://undefined", "Missing NEXT_PUBLIC_URL");
  assert(path.startsWith("/"), "Path must start with /");
  return `${publicUrl}${path}`;
}
