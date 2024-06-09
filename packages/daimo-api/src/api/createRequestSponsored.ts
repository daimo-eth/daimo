import { decodeRequestIdString } from "@daimo/common";
import { daimoRequestABI, daimoRequestAddress } from "@daimo/contract";
import { Address, Hex, stringToHex } from "viem";

import { RequestIndexer } from "../contract/requestIndexer";
import { ViemClient } from "../network/viemClient";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";

interface RequestV2Input {
  idString: string;
  recipient: Address;
  amount: `${bigint}`;
  fulfiller?: Address;
  memo?: string;
}

export async function createRequestSponsored(
  vc: ViemClient,
  requestIndexer: RequestIndexer,
  paymentMemoTracker: PaymentMemoTracker,
  input: RequestV2Input
): Promise<Hex> {
  const { idString, recipient, amount, fulfiller, memo } = input;

  // Verify ID is unused
  const id = decodeRequestIdString(idString);
  const requestStatus = requestIndexer.getRequestStatusById(id);
  if (requestStatus) {
    throw new Error("request ID already exists");
  }

  // Requesting from a specific person? Stored onchain. (Not enforced, no need,
  // anyone can still fulfill the request on that person's behalf.)
  let metadata: Hex = "0x00";
  if (fulfiller) {
    const rawMetadata = JSON.stringify({ v: 0, fulfiller });
    metadata = stringToHex(rawMetadata);
  }

  // Create onchain request
  console.log(`[API] creating req ${id} ${recipient} ${amount} ${fulfiller}`);
  const requestTxHash = await vc.writeContract({
    abi: daimoRequestABI,
    address: daimoRequestAddress,
    functionName: "createRequest",
    args: [id, recipient, BigInt(amount), metadata],
  });

  // Store memo, if applicable
  if (memo != null) {
    paymentMemoTracker.addMemo(requestTxHash, memo);
  }

  return requestTxHash;
}
