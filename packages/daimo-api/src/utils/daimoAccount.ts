import { daimoAccountABI } from "@daimo/contract";
import { Address, Hex, hashMessage } from "viem";

import { ViemClient } from "../network/viemClient";

// Verify ERC-1271-signed offchain action
export async function verifyDaimoAccountSignature(
  message: string,
  signature: Hex,
  addr: Address,
  viemClient: ViemClient
) {
  const messageHash = hashMessage(message);
  const verifySigResult = await viemClient.publicClient.readContract({
    abi: daimoAccountABI,
    address: addr,
    functionName: "isValidSignature",
    args: [messageHash, signature],
  });
  return verifySigResult === "0x1626ba7e";
}
