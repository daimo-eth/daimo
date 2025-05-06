import { daimoAccountAbi } from "@daimo/contract";
import { Address, Hex } from "viem";

import { ViemClient } from "../network/viemClient";

const ERC1271_MAGIC_VALUE = "0x1626ba7e";

/**
 * Verify an ERC-1271-signed offchain action
 */
export async function verifyERC1271Signature(
  vc: ViemClient,
  addr: Address,
  messageHash: Hex,
  signature: Hex
): Promise<boolean> {
  const verifySigResult = await vc.publicClient.readContract({
    abi: daimoAccountAbi,
    address: addr,
    functionName: "isValidSignature",
    args: [messageHash, signature],
  });
  console.log("[VERIFY] isValidSignature result:", verifySigResult);

  return verifySigResult === ERC1271_MAGIC_VALUE;
}
