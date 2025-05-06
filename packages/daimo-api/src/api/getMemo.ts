import { Hex } from "viem";

import { OpIndexer, UserOp } from "../contract/opIndexer";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";

type TransactionMemo = {
  txHash: Hex;
  logIndex: number;
  opHash?: Hex;
  memo?: string;
};

/** Retreives a payment memo given a bundle transaction hash and log index. */
export async function getMemo(
  txHash: Hex,
  logIndex: number,
  opIndexer: OpIndexer,
  paymentMemoTracker: PaymentMemoTracker
): Promise<TransactionMemo | undefined> {
  const userOp: UserOp | undefined = opIndexer.fetchUserOpLog(txHash, logIndex);
  const opHash = userOp?.hash;
  const memo = opHash ? paymentMemoTracker.getMemo(opHash) : undefined;
  const transactionMemo: TransactionMemo = {
    txHash,
    logIndex,
    opHash,
    memo,
  };
  return transactionMemo;
}
