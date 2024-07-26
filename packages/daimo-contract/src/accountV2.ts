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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoFastCCTP
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoFastCctpABI = [
  { stateMutability: "nonpayable", type: "constructor", inputs: [] },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "fromChainID", internalType: "uint256", type: "uint256" },
      { name: "fromAddr", internalType: "address", type: "address" },
      { name: "fromAmount", internalType: "uint256", type: "uint256" },
      { name: "toAddr", internalType: "address", type: "address" },
      { name: "toToken", internalType: "contract IERC20", type: "address" },
      { name: "toAmount", internalType: "uint256", type: "uint256" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "claimTransfer",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "fromChainID", internalType: "uint256", type: "uint256" },
      { name: "fromAddr", internalType: "address", type: "address" },
      { name: "fromAmount", internalType: "uint256", type: "uint256" },
      { name: "toAddr", internalType: "address", type: "address" },
      { name: "toToken", internalType: "contract IERC20", type: "address" },
      { name: "toAmount", internalType: "uint256", type: "uint256" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "fastFinishTransfer",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "fromChainID", internalType: "uint256", type: "uint256" },
      { name: "fromAddr", internalType: "address", type: "address" },
      { name: "fromAmount", internalType: "uint256", type: "uint256" },
      { name: "toChainID", internalType: "uint256", type: "uint256" },
      { name: "toAddr", internalType: "address", type: "address" },
      { name: "toToken", internalType: "contract IERC20", type: "address" },
      { name: "toAmount", internalType: "uint256", type: "uint256" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "getHandoffAddr",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "handoffSent",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "handoffToRecipient",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "cctpMessenger",
        internalType: "contract ICCTPTokenMessenger",
        type: "address",
      },
      { name: "fromToken", internalType: "contract IERC20", type: "address" },
      { name: "fromAmount", internalType: "uint256", type: "uint256" },
      { name: "toChainID", internalType: "uint256", type: "uint256" },
      { name: "toDomain", internalType: "uint32", type: "uint32" },
      { name: "toAddr", internalType: "address", type: "address" },
      { name: "toToken", internalType: "contract IERC20", type: "address" },
      { name: "toAmount", internalType: "uint256", type: "uint256" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "startTransfer",
    outputs: [],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "handoffAddr",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "finalRecipient",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "fromChainID",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "fromAddr",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "fromAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "toAddr",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toToken",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Claim",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "handoffAddr",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newRecipient",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "fromChainID",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "fromAddr",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "fromAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "toAddr",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toToken",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "FastFinish",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "handoffAddr",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "fromToken",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "fromAmount",
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
      {
        name: "toAddr",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toToken",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "toAmount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Start",
  },
] as const;

export const daimoFastCctpAddress =
  "0x779934cD046a0Bc09dFDcd7C92B41Aff3A076838" as const;

export const daimoFastCctpConfig = {
  address: daimoFastCctpAddress,
  abi: daimoFastCctpABI,
} as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoFlexSwapper
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoFlexSwapperABI = [
  { stateMutability: "nonpayable", type: "constructor", inputs: [] },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "pool", internalType: "address", type: "address" },
      { name: "secondsAgo", internalType: "uint32", type: "uint32" },
    ],
    name: "consultOracle",
    outputs: [
      { name: "arithmeticMeanTick", internalType: "int24", type: "int24" },
      {
        name: "harmonicMeanLiquidity",
        internalType: "uint128",
        type: "uint128",
      },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "sig",
        internalType: "struct DaimoFlexSwapper.DaimoFlexSwapperExtraData",
        type: "tuple",
        components: [
          { name: "callDest", internalType: "address", type: "address" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          {
            name: "tipToExactAmountOut",
            internalType: "uint128",
            type: "uint128",
          },
          { name: "tipPayer", internalType: "address", type: "address" },
        ],
      },
    ],
    name: "extraDataStruct",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "tokenA", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint128", type: "uint128" },
      { name: "tokenB", internalType: "contract IERC20", type: "address" },
    ],
    name: "getBestPoolTick",
    outputs: [
      { name: "bestPool", internalType: "address", type: "address" },
      { name: "tick", internalType: "int24", type: "int24" },
      { name: "bestFee", internalType: "uint24", type: "uint24" },
      { name: "bestAmountOut", internalType: "uint128", type: "uint128" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "hopTokens",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "implementation",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "_initialOwner", internalType: "address", type: "address" },
      {
        name: "_wrappedNativeToken",
        internalType: "contract IERC20",
        type: "address",
      },
      {
        name: "_hopTokens",
        internalType: "contract IERC20[]",
        type: "address[]",
      },
      {
        name: "_outputTokens",
        internalType: "contract IERC20[]",
        type: "address[]",
      },
      {
        name: "_stablecoins",
        internalType: "contract IERC20[]",
        type: "address[]",
      },
      { name: "_swapRouter02", internalType: "address", type: "address" },
      { name: "_oracleFeeTiers", internalType: "uint24[]", type: "uint24[]" },
      { name: "_oraclePeriod", internalType: "uint32", type: "uint32" },
      {
        name: "_oraclePoolFactory",
        internalType: "contract IUniswapV3Factory",
        type: "address",
      },
    ],
    name: "init",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
    name: "isOutputToken",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
    name: "isStablecoin",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "oracleFeeTiers",
    outputs: [{ name: "", internalType: "uint24", type: "uint24" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "oraclePeriod",
    outputs: [{ name: "", internalType: "uint32", type: "uint32" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "oraclePoolFactory",
    outputs: [
      { name: "", internalType: "contract IUniswapV3Factory", type: "address" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "outputTokens",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "pendingOwner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint128", type: "uint128" },
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
    ],
    name: "quote",
    outputs: [
      { name: "amountOut", internalType: "uint256", type: "uint256" },
      { name: "swapPath", internalType: "bytes", type: "bytes" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint128", type: "uint128" },
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
    ],
    name: "quoteDirect",
    outputs: [
      { name: "amountOut", internalType: "uint128", type: "uint128" },
      { name: "fee", internalType: "uint24", type: "uint24" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint128", type: "uint128" },
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
    ],
    name: "quoteViaHop",
    outputs: [
      { name: "amountOut", internalType: "uint256", type: "uint256" },
      { name: "swapPath", internalType: "bytes", type: "bytes" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "stablecoins",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "swapRouter02",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "tokenIn", internalType: "contract IERC20", type: "address" },
      { name: "amountIn", internalType: "uint256", type: "uint256" },
      { name: "tokenOut", internalType: "contract IERC20", type: "address" },
      { name: "extraData", internalType: "bytes", type: "bytes" },
    ],
    name: "swapToCoin",
    outputs: [
      { name: "totalAmountOut", internalType: "uint256", type: "uint256" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "newImplementation", internalType: "address", type: "address" },
    ],
    name: "upgradeTo",
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "newImplementation", internalType: "address", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "wrappedNativeToken",
    outputs: [{ name: "", internalType: "contract IERC20", type: "address" }],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "newAdmin",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "AdminChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "beacon",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "BeaconUpgraded",
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
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferStarted",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "tokenIn",
        internalType: "address",
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
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "estAmountOut",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "swapAmountOut",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "totalAmountOut",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "SwapToCoin",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
  { type: "error", inputs: [], name: "T" },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EphemeralHandoff
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ephemeralHandoffABI = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "address", type: "address" },
      { name: "fromAmount", internalType: "uint256", type: "uint256" },
      { name: "toChainID", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "address", type: "address" },
      { name: "toToken", internalType: "contract IERC20", type: "address" },
      { name: "", internalType: "uint256", type: "uint256" },
      { name: "", internalType: "uint256", type: "uint256" },
    ],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "receiveTransferAndSelfDestruct",
    outputs: [],
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SwapbotLP
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const swapbotLpABI = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [{ name: "_owner", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "pendingOwner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "swapbotAction", internalType: "bytes", type: "bytes" }],
    name: "run",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferStarted",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "previousOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
] as const;
