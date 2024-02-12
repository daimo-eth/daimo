import { decodeRequestIdString } from "@daimo/common";
import { daimoRequestABI, daimoRequestAddress } from "@daimo/contract";
import { Address, Hex } from "viem";

import { RequestIndexer } from "../contract/requestIndexer";
import { ViemClient } from "../network/viemClient";

export async function createRequestSponsored(
  vc: ViemClient,
  requestIndexer: RequestIndexer,
  idString: string,
  recipient: Address,
  amount: `${bigint}`
): Promise<Hex> {
  const id = decodeRequestIdString(idString);
  // Verify ID is unused
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

  return requestTxHash;
}
