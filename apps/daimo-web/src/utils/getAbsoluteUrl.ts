import { assert } from "@daimo/common";

import { envVarsWeb } from "../env";

export function getAbsoluteUrl(path: string) {
  assert(path.startsWith("/"), "Path must start with /");
  return `${envVarsWeb.NEXT_PUBLIC_URL}${path}`;
}
