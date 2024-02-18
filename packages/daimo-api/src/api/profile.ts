import {
  FarcasterLinkedAccount,
  LinkedAccount,
  assertEqual,
  zFarcasterLinkedAccount,
} from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { Address, Hex, hashMessage } from "viem";

import { ViemClient } from "../network/viemClient";

export async function profileLinkAccount(
  addr: Address,
  linkedAccountJSON: string,
  signature: Hex,
  vc: ViemClient
): Promise<LinkedAccount[]> {
  console.log(`[PROFILE] linking: ${linkedAccountJSON}, sig: ${signature}`);

  // Verify signature
  const messageHash = hashMessage(linkedAccountJSON);
  const verifySigResult = await vc.publicClient.readContract({
    abi: daimoAccountABI,
    address: addr,
    functionName: "isValidSignature",
    args: [messageHash, signature],
  });
  assertEqual(verifySigResult, "0x1626ba7e", "ERC-1271 sig validation failed");

  const linkedAccount = JSON.parse(linkedAccountJSON);
  switch (linkedAccount.type) {
    case "farcaster":
      return linkFarcaster(addr, zFarcasterLinkedAccount.parse(linkedAccount));
    default:
      throw new Error(`Unsupported linked account ${linkedAccountJSON}`);
  }
}

async function linkFarcaster(
  addr: Address,
  fcAccount: FarcasterLinkedAccount
): Promise<LinkedAccount[]> {
  // TODO: write to DB
  // Return full list of linked accounts

  return [fcAccount];
}
