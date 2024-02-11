import { Address, Chain } from "viem";
import { base, baseSepolia, mainnet } from "viem/chains";

import {
  daimoEphemeralNotesAddress,
  daimoEphemeralNotesV2Address,
} from "./generated";

export type DaimoChain = "base" | "baseSepolia";

export function daimoChainFromId(chainId: number): DaimoChain {
  switch (chainId) {
    case base.id:
      return "base";
    case baseSepolia.id:
      return "baseSepolia";
    default:
      throw new Error(`unknown chainId ${chainId}`);
  }
}

export interface ChainConfig {
  daimoChain: DaimoChain;
  chainL1: Chain;
  chainL2: Chain;
  tokenAddress: Address;
  tokenSymbol: string;
  tokenDecimals: number;
  pimlicoPaymasterAddress: Address; // Unused, only for backup
  notesV1Address: Address;
  notesV2Address: Address;
}

// EphemeralNotes contract varies by chain due to different USDC addresses
export const notesV1AddressMap = new Map<number, Address>([
  [8453, "0x4AdcA7cB84497c9c4c308063D2f219C7b6041183"],
  [84532, "0xfBdb4f1172AaDADdFe4233550e9cD5E4aA1Dae00"],
]);
export const notesV2AddressMap = new Map<number, Address>([
  [8453, "0x594bc666500fAeD35DC741F45a35C571399560d8"],
  [84532, "0xf823d42B543ec9785f973E9Aa3187E42248F4874"],
]);

if (
  notesV1AddressMap.get(8453) !== daimoEphemeralNotesAddress ||
  notesV2AddressMap.get(8453) !== daimoEphemeralNotesV2Address
) {
  throw new Error("EphemeralNotes address mismatch");
}

export function getChainConfig(daimoChain: DaimoChain): ChainConfig {
  switch (daimoChain) {
    case "base":
      return {
        daimoChain,
        chainL1: mainnet,
        chainL2: base,
        tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        pimlicoPaymasterAddress: "0x939263eAFE57038a072cb4edD6B25dd81A8A6c56",
        notesV1Address: assertNotNull(notesV1AddressMap.get(base.id)),
        notesV2Address: assertNotNull(notesV2AddressMap.get(base.id)),
      };
    case "baseSepolia":
      return {
        daimoChain,
        chainL1: mainnet, // ENS resolution = eth mainnet, read-only
        chainL2: baseSepolia,
        tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        pimlicoPaymasterAddress: "0x0000000000dd6dd248ab5487218e1c2d7fbb29c9",
        notesV1Address: assertNotNull(notesV1AddressMap.get(baseSepolia.id)),
        notesV2Address: assertNotNull(notesV2AddressMap.get(baseSepolia.id)),
      };
    default:
      throw new Error(`unknown chain '${daimoChain}'`);
  }
}

function assertNotNull<T>(arg: T | null | undefined): T {
  if (arg == null) throw new Error();
  return arg;
}
