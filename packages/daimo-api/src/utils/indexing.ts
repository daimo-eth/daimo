import { Address, Hex } from "viem";

// log coordinate key: [transactionHash, logIndex]
export function logCoordinateKey(transactionHash: Hex, logIndex: number) {
  return transactionHash + ":" + logIndex;
}

export function senderIdKey(sender: Address, id: string) {
  return sender + ":" + id;
}

export function addrBlockNumKey(addr: Address, blockNum: number) {
  return addr + ":" + blockNum;
}

export function addrTxHashKey(addr: Address, txHash: Hex) {
  return addr + ":" + txHash;
}

export function addrTokenKey(addr: Address, token: Address) {
  return addr + ":" + token;
}

export function chainIdEventNonceKey(chainId: number, eventNonce: number) {
  return chainId + ":" + eventNonce;
}
