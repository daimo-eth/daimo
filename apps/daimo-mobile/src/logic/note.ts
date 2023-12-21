import {
  getNoteClaimSignature,
  getNoteClaimSignatureFromSeed,
} from "@daimo/common";
import { useEffect, useState } from "react";
import { Address, Hex } from "viem";

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
