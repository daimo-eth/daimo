import { assert, daimoDomainAddress } from "@daimo/common";

const publicUrl = (function () {
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  } else {
    return daimoDomainAddress;
  }
})();

export function getAbsoluteUrl(path: string) {
  assert(path.startsWith("/"), "Path must start with /");
  return `${publicUrl}${path}`;
}
