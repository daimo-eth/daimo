import { Address, Hex } from "viem";

// log coordinate key: [transactionHash, logIndex]
export function logCoordinateKey(transactionHash: Hex, logIndex: number) {
  return transactionHash + ":" + logIndex;
}

export function senderIdKey(sender: Address, id: string) {
  return sender + ":" + id;
}
