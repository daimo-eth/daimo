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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccountV2
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountV2ABI = [
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
  { stateMutability: "payable", type: "receive" },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "slot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
    ],
    name: "addSigningKey",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "bridger",
    outputs: [
      { name: "", internalType: "contract IDaimoBridger", type: "address" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "tokenBridge", internalType: "contract IERC20", type: "address" },
      { name: "extraDataSwap", internalType: "bytes", type: "bytes" },
      { name: "extraDataBridge", internalType: "bytes", type: "bytes" },
    ],
    name: "collect",
    outputs: [],
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
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "calls",
        internalType: "struct DaimoAccountV2.Call[]",
        type: "tuple[]",
        components: [
          { name: "dest", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "executeBatch",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
    ],
    name: "forward",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "forwardingAddress",
    outputs: [{ name: "", internalType: "address payable", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "getActiveSigningKeys",
    outputs: [
      {
        name: "activeSigningKeys",
        internalType: "bytes32[2][]",
        type: "bytes32[2][]",
      },
      {
        name: "activeSigningKeySlots",
        internalType: "uint8[]",
        type: "uint8[]",
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "homeChain",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "homeCoin",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "_homeChain", internalType: "uint256", type: "uint256" },
      { name: "_homeCoin", internalType: "contract IERC20", type: "address" },
      {
        name: "_swapper",
        internalType: "contract IDaimoSwapper",
        type: "address",
      },
      {
        name: "_bridger",
        internalType: "contract IDaimoBridger",
        type: "address",
      },
      { name: "slot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
    ],
    name: "initialize",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "message", internalType: "bytes32", type: "bytes32" },
      { name: "signature", internalType: "bytes", type: "bytes" },
    ],
    name: "isValidSignature",
    outputs: [{ name: "magicValue", internalType: "bytes4", type: "bytes4" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "", internalType: "uint8", type: "uint8" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
    name: "keys",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "maxKeys",
    outputs: [{ name: "", internalType: "uint8", type: "uint8" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "numActiveKeys",
    outputs: [{ name: "", internalType: "uint8", type: "uint8" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "slot", internalType: "uint8", type: "uint8" }],
    name: "removeSigningKey",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "newAddr", internalType: "address payable", type: "address" },
    ],
    name: "setForwardingAddress",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "sig",
        internalType: "struct DaimoAccountV2.Signature",
        type: "tuple",
        components: [
          { name: "keySlot", internalType: "uint8", type: "uint8" },
          { name: "authenticatorData", internalType: "bytes", type: "bytes" },
          { name: "clientDataJSON", internalType: "string", type: "string" },
          { name: "r", internalType: "uint256", type: "uint256" },
          { name: "s", internalType: "uint256", type: "uint256" },
        ],
      },
    ],
    name: "signatureStruct",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "extraData", internalType: "bytes", type: "bytes" },
    ],
    name: "swapToHomeCoin",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "swapper",
    outputs: [
      { name: "", internalType: "contract IDaimoSwapper", type: "address" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "newHomeCoin", internalType: "contract IERC20", type: "address" },
    ],
    name: "updateHomeCoin",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "userOp",
        internalType: "struct UserOperation",
        type: "tuple",
        components: [
          { name: "sender", internalType: "address", type: "address" },
          { name: "nonce", internalType: "uint256", type: "uint256" },
          { name: "initCode", internalType: "bytes", type: "bytes" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          { name: "callGasLimit", internalType: "uint256", type: "uint256" },
          {
            name: "verificationGasLimit",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "preVerificationGas",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "maxFeePerGas", internalType: "uint256", type: "uint256" },
          {
            name: "maxPriorityFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "paymasterAndData", internalType: "bytes", type: "bytes" },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
      { name: "userOpHash", internalType: "bytes32", type: "bytes32" },
      { name: "missingAccountFunds", internalType: "uint256", type: "uint256" },
    ],
    name: "validateUserOp",
    outputs: [
      { name: "validationData", internalType: "uint256", type: "uint256" },
    ],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "entryPoint",
        internalType: "contract IEntryPoint",
        type: "address",
        indexed: true,
      },
      {
        name: "homeChain",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "homeCoin",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "swapper",
        internalType: "contract IDaimoSwapper",
        type: "address",
        indexed: false,
      },
      {
        name: "bridger",
        internalType: "contract IDaimoBridger",
        type: "address",
        indexed: false,
      },
    ],
    name: "AccountInitialized",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "tokenIn",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "amountIn",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "tokenOut",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "amountOut",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "AutoSwap",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "tokenIn",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "amountIn",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "tokenBridge",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "amountBridge",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "toChainID",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Collect",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "tokenIn",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "amountIn",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "ForwardAsset",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "version", internalType: "uint8", type: "uint8", indexed: false },
    ],
    name: "Initialized",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "forwardingAddress",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "SetForwardingAddress",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "contract IAccount",
        type: "address",
        indexed: true,
      },
      { name: "keySlot", internalType: "uint8", type: "uint8", indexed: false },
      {
        name: "key",
        internalType: "bytes32[2]",
        type: "bytes32[2]",
        indexed: false,
      },
    ],
    name: "SigningKeyAdded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "contract IAccount",
        type: "address",
        indexed: true,
      },
      { name: "keySlot", internalType: "uint8", type: "uint8", indexed: false },
      {
        name: "key",
        internalType: "bytes32[2]",
        type: "bytes32[2]",
        indexed: false,
      },
    ],
    name: "SigningKeyRemoved",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "oldHomeCoin",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
      {
        name: "newHomeCoin",
        internalType: "contract IERC20",
        type: "address",
        indexed: false,
      },
    ],
    name: "UpdateHomeCoin",
  },
] as const;
