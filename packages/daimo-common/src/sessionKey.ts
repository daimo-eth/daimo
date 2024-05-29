import { base32 } from "@scure/base";
import { hexToBytes } from "viem";
import { generatePrivateKey } from "viem/accounts";

export function generateSessionSecret(): string {
  const hexSeed = generatePrivateKey();

  return base32.encode(hexToBytes(hexSeed));
}

export function getSessionSecretSigningMessage(sessionSecret: string) {
  return `session-key-${sessionSecret}`;
}
