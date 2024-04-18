import { Hex } from "viem";

import { OpIndexer, UserOp } from "../contract/opIndexer";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";

/** Retreives a payment memo given a transaction hash and log index. */
export async function getMemo(
  txHash: string,
  logIndex: number,
  opIndexer: OpIndexer,
  paymentMemoTracker: PaymentMemoTracker
): Promise<string | undefined> {
  const userOp: UserOp | undefined = opIndexer.fetchUserOpLog(
    txHash as Hex,
    logIndex
  );
  const opHash = userOp?.hash;
  const memo = opHash ? paymentMemoTracker.getMemo(opHash) : undefined;
  return memo;
}
