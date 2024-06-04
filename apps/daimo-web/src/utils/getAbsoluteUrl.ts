import { assert, daimoDomainAddress } from "@daimo/common";

import { envVarsWeb } from "../env";

const publicUrl = (function () {
  if (envVarsWeb.NEXT_PUBLIC_URL) {
    return envVarsWeb.NEXT_PUBLIC_URL;
  } else if (envVarsWeb.VERCEL_URL) {
    return `https://${envVarsWeb.VERCEL_URL}`;
  } else {
    return daimoDomainAddress;
  }
})();

export function getAbsoluteUrl(path: string) {
  assert(path.startsWith("/"), "Path must start with /");
  return `${publicUrl}${path}`;
}
