// Older generated code for DaimoAccount
// We need this to run DaimoAccount (V1) transactions, for login & migration.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountAbi = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      {
        name: "_entryPoint",
        internalType: "contract IEntryPoint",
        type: "address",
      },
      {
        name: "_daimoVerifier",
        internalType: "contract DaimoVerifier",
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
        internalType: "struct DaimoAccount.Call[]",
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
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "slot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
      {
        name: "initCalls",
        internalType: "struct DaimoAccount.Call[]",
        type: "tuple[]",
        components: [
          { name: "dest", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
        ],
      },
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
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
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
      {
        name: "sig",
        internalType: "struct Signature",
        type: "tuple",
        components: [
          { name: "authenticatorData", internalType: "bytes", type: "bytes" },
          { name: "clientDataJSON", internalType: "string", type: "string" },
          {
            name: "challengeLocation",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "responseTypeLocation",
            internalType: "uint256",
            type: "uint256",
          },
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
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "verifier",
    outputs: [
      { name: "", internalType: "contract DaimoVerifier", type: "address" },
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
    ],
    name: "AccountInitialized",
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
        name: "implementation",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "Upgraded",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccountFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountFactoryAbi = [
  {
    stateMutability: "nonpayable",
    type: "constructor",
    inputs: [
      {
        name: "_entryPoint",
        internalType: "contract IEntryPoint",
        type: "address",
      },
      {
        name: "_verifier",
        internalType: "contract DaimoVerifier",
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
      { name: "", internalType: "contract DaimoAccount", type: "address" },
    ],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "keySlot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
      {
        name: "initCalls",
        internalType: "struct DaimoAccount.Call[]",
        type: "tuple[]",
        components: [
          { name: "dest", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
        ],
      },
      { name: "salt", internalType: "uint256", type: "uint256" },
    ],
    name: "createAccount",
    outputs: [
      { name: "ret", internalType: "contract DaimoAccount", type: "address" },
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
      { name: "keySlot", internalType: "uint8", type: "uint8" },
      { name: "key", internalType: "bytes32[2]", type: "bytes32[2]" },
      {
        name: "initCalls",
        internalType: "struct DaimoAccount.Call[]",
        type: "tuple[]",
        components: [
          { name: "dest", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
        ],
      },
      { name: "salt", internalType: "uint256", type: "uint256" },
    ],
    name: "getAddress",
    outputs: [{ name: "", internalType: "address", type: "address" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "verifier",
    outputs: [
      { name: "", internalType: "contract DaimoVerifier", type: "address" },
    ],
  },
] as const;

export const daimoAccountFactoryAddress =
  "0xF9D643f5645C6140b8EEb7eF42878b71eBfEe40b" as const;

export const daimoAccountFactoryConfig = {
  address: daimoAccountFactoryAddress,
  abi: daimoAccountFactoryAbi,
} as const;
