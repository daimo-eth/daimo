export const entryPointV06Address =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
export const entryPointV06Abi = [
  { stateMutability: "payable", type: "receive" },
  {
    stateMutability: "view",
    type: "function",
    inputs: [],
    name: "SIG_VALIDATION_FAILED",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "initCode", internalType: "bytes", type: "bytes" },
      { name: "sender", internalType: "address", type: "address" },
      { name: "paymasterAndData", internalType: "bytes", type: "bytes" },
    ],
    name: "_validateSenderAndPaymaster",
    outputs: [],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [
      { name: "unstakeDelaySec", internalType: "uint32", type: "uint32" },
    ],
    name: "addStake",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "account", internalType: "address", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "payable",
    type: "function",
    inputs: [{ name: "account", internalType: "address", type: "address" }],
    name: "depositTo",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "deposits",
    outputs: [
      { name: "deposit", internalType: "uint112", type: "uint112" },
      { name: "staked", internalType: "bool", type: "bool" },
      { name: "stake", internalType: "uint112", type: "uint112" },
      { name: "unstakeDelaySec", internalType: "uint32", type: "uint32" },
      { name: "withdrawTime", internalType: "uint48", type: "uint48" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [{ name: "account", internalType: "address", type: "address" }],
    name: "getDepositInfo",
    outputs: [
      {
        name: "info",
        internalType: "struct IStakeManager.DepositInfo",
        type: "tuple",
        components: [
          {
            name: "deposit",
            internalType: "uint112",
            type: "uint112",
          },
          { name: "staked", internalType: "bool", type: "bool" },
          { name: "stake", internalType: "uint112", type: "uint112" },
          {
            name: "unstakeDelaySec",
            internalType: "uint32",
            type: "uint32",
          },
          {
            name: "withdrawTime",
            internalType: "uint48",
            type: "uint48",
          },
        ],
      },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      { name: "key", internalType: "uint192", type: "uint192" },
    ],
    name: "getNonce",
    outputs: [{ name: "nonce", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "initCode", internalType: "bytes", type: "bytes" }],
    name: "getSenderAddress",
    outputs: [],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      {
        name: "userOp",
        internalType: "struct UserOperation",
        type: "tuple",
        components: [
          {
            name: "sender",
            internalType: "address",
            type: "address",
          },
          { name: "nonce", internalType: "uint256", type: "uint256" },
          { name: "initCode", internalType: "bytes", type: "bytes" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          {
            name: "callGasLimit",
            internalType: "uint256",
            type: "uint256",
          },
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
          {
            name: "maxFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "maxPriorityFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "paymasterAndData",
            internalType: "bytes",
            type: "bytes",
          },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "getUserOpHash",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "opsPerAggregator",
        internalType: "struct IEntryPoint.UserOpsPerAggregator[]",
        type: "tuple[]",
        components: [
          {
            name: "userOps",
            internalType: "struct UserOperation[]",
            type: "tuple[]",
            components: [
              {
                name: "sender",
                internalType: "address",
                type: "address",
              },
              {
                name: "nonce",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "initCode",
                internalType: "bytes",
                type: "bytes",
              },
              {
                name: "callData",
                internalType: "bytes",
                type: "bytes",
              },
              {
                name: "callGasLimit",
                internalType: "uint256",
                type: "uint256",
              },
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
              {
                name: "maxFeePerGas",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "maxPriorityFeePerGas",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "paymasterAndData",
                internalType: "bytes",
                type: "bytes",
              },
              {
                name: "signature",
                internalType: "bytes",
                type: "bytes",
              },
            ],
          },
          {
            name: "aggregator",
            internalType: "contract IAggregator",
            type: "address",
          },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
      {
        name: "beneficiary",
        internalType: "address payable",
        type: "address",
      },
    ],
    name: "handleAggregatedOps",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "ops",
        internalType: "struct UserOperation[]",
        type: "tuple[]",
        components: [
          {
            name: "sender",
            internalType: "address",
            type: "address",
          },
          { name: "nonce", internalType: "uint256", type: "uint256" },
          { name: "initCode", internalType: "bytes", type: "bytes" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          {
            name: "callGasLimit",
            internalType: "uint256",
            type: "uint256",
          },
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
          {
            name: "maxFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "maxPriorityFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "paymasterAndData",
            internalType: "bytes",
            type: "bytes",
          },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
      {
        name: "beneficiary",
        internalType: "address payable",
        type: "address",
      },
    ],
    name: "handleOps",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [{ name: "key", internalType: "uint192", type: "uint192" }],
    name: "incrementNonce",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      { name: "callData", internalType: "bytes", type: "bytes" },
      {
        name: "opInfo",
        internalType: "struct EntryPoint.UserOpInfo",
        type: "tuple",
        components: [
          {
            name: "mUserOp",
            internalType: "struct EntryPoint.MemoryUserOp",
            type: "tuple",
            components: [
              {
                name: "sender",
                internalType: "address",
                type: "address",
              },
              {
                name: "nonce",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "callGasLimit",
                internalType: "uint256",
                type: "uint256",
              },
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
              {
                name: "paymaster",
                internalType: "address",
                type: "address",
              },
              {
                name: "maxFeePerGas",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "maxPriorityFeePerGas",
                internalType: "uint256",
                type: "uint256",
              },
            ],
          },
          {
            name: "userOpHash",
            internalType: "bytes32",
            type: "bytes32",
          },
          {
            name: "prefund",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "contextOffset",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "preOpGas",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      { name: "context", internalType: "bytes", type: "bytes" },
    ],
    name: "innerHandleOp",
    outputs: [
      { name: "actualGasCost", internalType: "uint256", type: "uint256" },
    ],
  },
  {
    stateMutability: "view",
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "uint192", type: "uint192" },
    ],
    name: "nonceSequenceNumber",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "op",
        internalType: "struct UserOperation",
        type: "tuple",
        components: [
          {
            name: "sender",
            internalType: "address",
            type: "address",
          },
          { name: "nonce", internalType: "uint256", type: "uint256" },
          { name: "initCode", internalType: "bytes", type: "bytes" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          {
            name: "callGasLimit",
            internalType: "uint256",
            type: "uint256",
          },
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
          {
            name: "maxFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "maxPriorityFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "paymasterAndData",
            internalType: "bytes",
            type: "bytes",
          },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
      { name: "target", internalType: "address", type: "address" },
      { name: "targetCallData", internalType: "bytes", type: "bytes" },
    ],
    name: "simulateHandleOp",
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
          {
            name: "sender",
            internalType: "address",
            type: "address",
          },
          { name: "nonce", internalType: "uint256", type: "uint256" },
          { name: "initCode", internalType: "bytes", type: "bytes" },
          { name: "callData", internalType: "bytes", type: "bytes" },
          {
            name: "callGasLimit",
            internalType: "uint256",
            type: "uint256",
          },
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
          {
            name: "maxFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "maxPriorityFeePerGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "paymasterAndData",
            internalType: "bytes",
            type: "bytes",
          },
          { name: "signature", internalType: "bytes", type: "bytes" },
        ],
      },
    ],
    name: "simulateValidation",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [],
    name: "unlockStake",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "withdrawAddress",
        internalType: "address payable",
        type: "address",
      },
    ],
    name: "withdrawStake",
    outputs: [],
  },
  {
    stateMutability: "nonpayable",
    type: "function",
    inputs: [
      {
        name: "withdrawAddress",
        internalType: "address payable",
        type: "address",
      },
      {
        name: "withdrawAmount",
        internalType: "uint256",
        type: "uint256",
      },
    ],
    name: "withdrawTo",
    outputs: [],
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "userOpHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "factory",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "paymaster",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "AccountDeployed",
  },
  { type: "event", anonymous: false, inputs: [], name: "BeforeExecution" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "totalDeposit",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Deposited",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "aggregator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "SignatureAggregatorChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "totalStaked",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "unstakeDelaySec",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "StakeLocked",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "withdrawTime",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "StakeUnlocked",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "withdrawAddress",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "StakeWithdrawn",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "userOpHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "paymaster",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "success",
        internalType: "bool",
        type: "bool",
        indexed: false,
      },
      {
        name: "actualGasCost",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "actualGasUsed",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "UserOperationEvent",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "userOpHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "revertReason",
        internalType: "bytes",
        type: "bytes",
        indexed: false,
      },
    ],
    name: "UserOperationRevertReason",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "account",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "withdrawAddress",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Withdrawn",
  },
  {
    type: "error",
    inputs: [
      { name: "preOpGas", internalType: "uint256", type: "uint256" },
      { name: "paid", internalType: "uint256", type: "uint256" },
      { name: "validAfter", internalType: "uint48", type: "uint48" },
      { name: "validUntil", internalType: "uint48", type: "uint48" },
      { name: "targetSuccess", internalType: "bool", type: "bool" },
      { name: "targetResult", internalType: "bytes", type: "bytes" },
    ],
    name: "ExecutionResult",
  },
  {
    type: "error",
    inputs: [
      { name: "opIndex", internalType: "uint256", type: "uint256" },
      { name: "reason", internalType: "string", type: "string" },
    ],
    name: "FailedOp",
  },
  {
    type: "error",
    inputs: [{ name: "sender", internalType: "address", type: "address" }],
    name: "SenderAddressResult",
  },
  {
    type: "error",
    inputs: [{ name: "aggregator", internalType: "address", type: "address" }],
    name: "SignatureValidationFailed",
  },
  {
    type: "error",
    inputs: [
      {
        name: "returnInfo",
        internalType: "struct IEntryPoint.ReturnInfo",
        type: "tuple",
        components: [
          {
            name: "preOpGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "prefund",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "sigFailed", internalType: "bool", type: "bool" },
          {
            name: "validAfter",
            internalType: "uint48",
            type: "uint48",
          },
          {
            name: "validUntil",
            internalType: "uint48",
            type: "uint48",
          },
          {
            name: "paymasterContext",
            internalType: "bytes",
            type: "bytes",
          },
        ],
      },
      {
        name: "senderInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      {
        name: "factoryInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      {
        name: "paymasterInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
    ],
    name: "ValidationResult",
  },
  {
    type: "error",
    inputs: [
      {
        name: "returnInfo",
        internalType: "struct IEntryPoint.ReturnInfo",
        type: "tuple",
        components: [
          {
            name: "preOpGas",
            internalType: "uint256",
            type: "uint256",
          },
          {
            name: "prefund",
            internalType: "uint256",
            type: "uint256",
          },
          { name: "sigFailed", internalType: "bool", type: "bool" },
          {
            name: "validAfter",
            internalType: "uint48",
            type: "uint48",
          },
          {
            name: "validUntil",
            internalType: "uint48",
            type: "uint48",
          },
          {
            name: "paymasterContext",
            internalType: "bytes",
            type: "bytes",
          },
        ],
      },
      {
        name: "senderInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      {
        name: "factoryInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      {
        name: "paymasterInfo",
        internalType: "struct IStakeManager.StakeInfo",
        type: "tuple",
        components: [
          { name: "stake", internalType: "uint256", type: "uint256" },
          {
            name: "unstakeDelaySec",
            internalType: "uint256",
            type: "uint256",
          },
        ],
      },
      {
        name: "aggregatorInfo",
        internalType: "struct IEntryPoint.AggregatorStakeInfo",
        type: "tuple",
        components: [
          {
            name: "aggregator",
            internalType: "address",
            type: "address",
          },
          {
            name: "stakeInfo",
            internalType: "struct IStakeManager.StakeInfo",
            type: "tuple",
            components: [
              {
                name: "stake",
                internalType: "uint256",
                type: "uint256",
              },
              {
                name: "unstakeDelaySec",
                internalType: "uint256",
                type: "uint256",
              },
            ],
          },
        ],
      },
    ],
    name: "ValidationResultWithAggregation",
  },
] as const;
