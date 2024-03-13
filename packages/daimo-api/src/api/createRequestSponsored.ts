import { decodeRequestIdString } from "@daimo/common";
import { daimoRequestABI, daimoRequestAddress } from "@daimo/contract";
import { Address, Hex, stringToHex } from "viem";

import { RequestIndexer } from "../contract/requestIndexer";
import { ViemClient } from "../network/viemClient";

interface RequestV2Input {
  idString: string;
  recipient: Address;
  amount: `${bigint}`;
  fulfiller?: string;
}

export async function createRequestSponsored(
  vc: ViemClient,
  requestIndexer: RequestIndexer,
  input: RequestV2Input
): Promise<Hex> {
  const { idString, recipient, amount, fulfiller } = input;

  // Verify ID is unused
  const id = decodeRequestIdString(idString);
  const requestStatus = requestIndexer.getRequestStatusById(id);
  if (requestStatus) {
    throw new Error("request ID already exists");
  }

  let metadata: Hex = "0x00";

  if (fulfiller) {
    const rawMetadata = JSON.stringify({ v: "0", fulfiller });
    metadata = stringToHex(rawMetadata);
  }

  const requestTxHash = await vc.writeContract({
    abi: daimoRequestABI,
    address: daimoRequestAddress,
    functionName: "createRequest",
    args: [id, recipient, BigInt(amount), metadata],
  });

  return requestTxHash;
}
