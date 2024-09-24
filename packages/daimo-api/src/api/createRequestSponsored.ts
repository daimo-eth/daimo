import {
  DaimoLinkRequestV2,
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  createRequestMetadata,
  decodeRequestIdString,
  encodeRequestId,
  now,
} from "@daimo/common";
import { daimoRequestAbi, daimoRequestAddress } from "@daimo/contract";
import { Address, Hex } from "viem";

import { NameRegistry } from "../contract/nameRegistry";
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
  nameReg: NameRegistry,
  input: RequestV2Input
): Promise<{ txHash: Hex; status: DaimoRequestV2Status }> {
  const { idString, recipient, amount, fulfiller, memo } = input;

  // Verify ID is unused
  const id = decodeRequestIdString(idString);
  const requestStatus = requestIndexer.getRequestStatusById(id);
  if (requestStatus) {
    throw new Error("request ID already exists");
  }

  // Requesting from a specific person? Stored onchain. (Not enforced, no need,
  // anyone can still fulfill the request on that person's behalf.)
  const metadata: Hex = createRequestMetadata(fulfiller && { v: 0, fulfiller });

  // Create onchain request
  console.log(`[API] creating req ${id} ${recipient} ${amount} ${fulfiller}`);
  const txHash = await vc.writeContract({
    abi: daimoRequestAbi,
    address: daimoRequestAddress,
    functionName: "createRequest",
    args: [id, recipient, BigInt(amount), metadata],
  });

  // Store memo, if applicable
  if (memo != null) {
    paymentMemoTracker.addMemo(txHash, memo);
  }

  // Generate pending request status
  const link: DaimoLinkRequestV2 = {
    type: "requestv2",
    id: encodeRequestId(id),
    recipient,
    dollars: amountToDollars(BigInt(amount)),
  };

  const creator = await nameReg.getEAccount(recipient);
  const nowS = now();
  const status: DaimoRequestV2Status = {
    link,
    status: DaimoRequestState.Pending,
    creator,
    recipient: creator,
    createdAt: nowS,
    updatedAt: nowS,
    metadata,
    expectedFulfiller: fulfiller && (await nameReg.getEAccount(fulfiller)),
    memo,
  };

  return { txHash, status };
}
