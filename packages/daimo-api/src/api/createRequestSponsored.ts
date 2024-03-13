import { decodeRequestIdString } from "@daimo/common";
import { daimoRequestABI, daimoRequestAddress } from "@daimo/contract";
import { Address, Hex } from "viem";

import { RequestIndexer } from "../contract/requestIndexer";
import { ViemClient } from "../network/viemClient";

interface RequestV2Input {
  idString: string;
  recipient: Address;
  amount: `${bigint}`;
  // TODO: Find a better name for this.
  proposedSender?: string;
}

export async function createRequestSponsored(
  vc: ViemClient,
  requestIndexer: RequestIndexer,
  input: RequestV2Input
): Promise<Hex> {
  const { idString, recipient, amount, proposedSender } = input;

  // Verify ID is unused
  const id = decodeRequestIdString(idString);
  const requestStatus = requestIndexer.getRequestStatusById(id);
  if (requestStatus) {
    throw new Error("request ID already exists");
  }

  const metadata = "0x00"; // TODO: Use metadata in rich requests
  const requestTxHash = await vc.writeContract({
    abi: daimoRequestABI,
    address: daimoRequestAddress,
    functionName: "createRequest",
    args: [id, recipient, BigInt(amount), metadata],
  });

  if (proposedSender) {
    // Send push notification.
    // Create database record to keep track of requests.
  }

  return requestTxHash;
}
