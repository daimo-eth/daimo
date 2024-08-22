import { Address, Chain } from "viem";
import { base, baseSepolia, mainnet } from "viem/chains";

import {
  daimoEphemeralNotesAddress,
  daimoEphemeralNotesV2Address,
} from "./codegen/contracts";

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

// Gets specified chain, or default if not specified. Throws if invalid.
export function daimoChainFromStr(str?: string | null): DaimoChain {
  if (str == null || str === "") return "base";
  switch (str) {
    case "base":
      return "base";
    case "baseSepolia":
      return "baseSepolia";
    default:
      throw new Error(`unsupported chain name ${str}`);
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
  offChainUtilsDeployBlock: number;
  uniswapRouterAddress: Address;
  uniswapETHPoolAddress: Address;
  cctpMessageTransmitterAddress: Address;
  circleAPIRoot: string;
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
        offChainUtilsDeployBlock: 13170550,
        uniswapRouterAddress: "0x2626664c2603336E57B271c5C0b26F421741e481",
        uniswapETHPoolAddress: "0xd0b53D9277642d899DF5C87A3966A349A798F224",
        cctpMessageTransmitterAddress:
          "0xAD09780d193884d503182aD4588450C416D6F9D4",
        circleAPIRoot: "https://iris-api.circle.com/v1",
      };
    case "baseSepolia":
      return {
        daimoChain,
        chainL1: mainnet, // ENS resolution = eth mainnet, read-only
        chainL2: baseSepolia,
        tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        tokenSymbol: "USDC",
        tokenDecimals: 6,
        pimlicoPaymasterAddress: "0x0000000000dd6Dd248Ab5487218e1C2D7fbB29c9",
        notesV1Address: assertNotNull(notesV1AddressMap.get(baseSepolia.id)),
        notesV2Address: assertNotNull(notesV2AddressMap.get(baseSepolia.id)),
        offChainUtilsDeployBlock: 8681107,
        uniswapRouterAddress: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
        uniswapETHPoolAddress: "0xd0b53D9277642d899DF5C87A3966A349A798F224", // TODO: there's no ETH/USDC pool with actual liquidity on Sepolia
        cctpMessageTransmitterAddress:
          "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
        circleAPIRoot: "https://iris-api-sandbox.circle.com/v1",
      };
    default:
      throw new Error(`unknown chain '${daimoChain}'`);
  }
}

function assertNotNull<T>(arg: T | null | undefined): T {
  if (arg == null) throw new Error();
  return arg;
}
