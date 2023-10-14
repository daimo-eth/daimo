import { getNoteClaimSignature } from "@daimo/common";
import { useEffect, useState } from "react";
import { Address, Hex } from "viem";

export function useEphemeralSignature(
  sender: Address,
  recipient: Address,
  ephemeralPrivateKey: `0x${string}` | undefined
) {
  const [ephemeralSignature, setEphemeralSignature] = useState<Hex>("0x");

  useEffect(() => {
    getNoteClaimSignature(sender, recipient, ephemeralPrivateKey).then(
      setEphemeralSignature
    );
  }, [ephemeralPrivateKey]);

  return ephemeralSignature;
}
