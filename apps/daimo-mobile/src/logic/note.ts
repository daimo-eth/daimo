import {
  getNoteClaimSignature,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { Address, Hex } from "viem";

/* Generate signature that allows claiming a payment link from either the
 * ephemeral private key or the seed, or neither (dummy signature) if the
 * sender is the claimer.
 */
export function useEphemeralSignature(
  sender: Address,
  recipient: Address,
  ephemeralPrivateKey: `0x${string}` | undefined,
  seed: string | undefined
) {
  const [ephemeralSignature, setEphemeralSignature] = useState<Hex>("0x");

  useEffect(() => {
    if (seed) {
      getNoteClaimSignatureFromSeed(sender, recipient, seed).then(
        setEphemeralSignature
      );
    } else {
      // Deprecated
      getNoteClaimSignature(sender, recipient, ephemeralPrivateKey).then(
        setEphemeralSignature
      );
    }
  }, [ephemeralPrivateKey, seed]);

  return ephemeralSignature;
}
