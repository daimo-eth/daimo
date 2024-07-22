import {
  daimoNameRegistryABI,
  daimoNameRegistryProxyAddress,
} from "./generated";

export const nameRegistryProxyConfig = {
  address: daimoNameRegistryProxyAddress,
  abi: daimoNameRegistryABI,
} as const;

export const teamDaimoFaucetAddr = "0x2A6d311394184EeB6Df8FBBF58626B085374Ffe7";

export const zeroAddr = "0x0000000000000000000000000000000000000000";

export * from "./external";

export * from "./chainConfig";

export {
  daimoAccountABI,
  daimoAccountFactoryABI,
  daimoAccountFactoryAddress,
  daimoAccountFactoryConfig,
  daimoEphemeralNotesABI,
  daimoEphemeralNotesV2ABI,
  daimoPaymasterV2ABI,
  daimoPaymasterV2Address,
  daimoRequestABI,
  daimoRequestAddress,
  daimoRequestConfig,
  daimoUsdcSwapperABI,
  entryPointABI,
  erc20ABI,
} from "./generated";

export const daimoFlexSwapperAddress =
  "0xd4f52859A6Fa075A6253C46A4D6367f2F8247165";

export const daimoCCTPBridgerAddress =
  "0xaaC79980B0Cc6475544946003605a98118407b63";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccountFactoryV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountFactoryV2ABI = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      {
        name: "_entryPoint",
        internalType: "contract IEntryPoint",
        type: "address",
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "accountImplementation",
    outputs: [
      { name: "", internalType: "contract DaimoAccountV2", type: "address" },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "homeChain", internalType: "uint256", type: "uint256" },
      { name: "homeCoin", internalType: "contract IERC20", type: "address" },
      {
        name: "swapper",
        internalType: "contract IDaimoSwapper",
        type: "address",
      },
      {
        name: "bridger",
        internalType: "contract IDaimoBridger",
        type: "address",
      },
      { name: "keySlot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
      { name: "salt", internalType: "uint256", type: "uint256" },
    ],
    name: "createAccount",
    outputs: [
      { name: "ret", internalType: "contract DaimoAccountV2", type: "address" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "entryPoint",
    outputs: [
      { name: "", internalType: "contract IEntryPoint", type: "address" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "homeChain", internalType: "uint256", type: "uint256" },
      { name: "homeCoin", internalType: "contract IERC20", type: "address" },
      {
        name: "swapper",
        internalType: "contract IDaimoSwapper",
        type: "address",
      },
      {
        name: "bridger",
        internalType: "contract IDaimoBridger",
        type: "address",
      },
      { name: "keySlot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
      { name: "salt", internalType: "uint256", type: "uint256" },
    ],
    name: "getAddress",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
] as const;

export const daimoAccountFactoryV2Address =
  "0xD65245e5e40FB7bf2935aa922AF223a888523353" as const;

export const daimoAccountFactoryV2Config = {
  address: daimoAccountFactoryV2Address,
  abi: daimoAccountFactoryV2ABI,
} as const;
