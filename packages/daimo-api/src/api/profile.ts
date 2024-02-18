import {
  LinkedAccount,
  assertEqual,
  zFarcasterLinkedAccount,
} from "@daimo/common";
import { daimoAccountABI } from "@daimo/contract";
import { Address, Hex, getAddress, hashMessage } from "viem";

import { DB } from "../db/db";
import { ViemClient } from "../network/viemClient";

export async function profileLinkAccount(
  addr: Address,
  linkedAccountJSON: string,
  signature: Hex,
  vc: ViemClient,
  db: DB
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

  const linkedAcc = JSON.parse(linkedAccountJSON);
  switch (linkedAcc.type) {
    case "farcaster":
      return linkFarcaster(addr, linkedAccountJSON, signature, db);
    default:
      throw new Error(`Unsupported linked account ${linkedAccountJSON}`);
  }
}

async function linkFarcaster(
  addr: Address,
  linkedAccountJSON: string,
  signature: Hex,
  db: DB
): Promise<LinkedAccount[]> {
  // TODO: write to DB
  // Return full list of linked accounts
  const linkedAcc = JSON.parse(linkedAccountJSON);
  const fcAccount = zFarcasterLinkedAccount.parse(linkedAcc);

  await db.saveLinkedAccount({
    linkedType: "farcaster",
    linkedId: getAddress(fcAccount.custody),
    address: addr,
    signedJson: linkedAccountJSON,
    signature,
  });

  // TODO: load from DB
  return [fcAccount];
}
