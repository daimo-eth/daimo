export declare const accountABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "anEntryPoint";
        readonly internalType: "contract IEntryPoint";
        readonly type: "address";
    }, {
        readonly name: "aSigVerifier";
        readonly internalType: "contract P256SHA256";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "entryPoint";
        readonly internalType: "contract IEntryPoint";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "accountKeyHash";
        readonly internalType: "bytes32[2]";
        readonly type: "bytes32[2]";
        readonly indexed: false;
    }];
    readonly name: "AccountInitialized";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "previousAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "newAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AdminChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "beacon";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "BeaconUpgraded";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "version";
        readonly internalType: "uint8";
        readonly type: "uint8";
        readonly indexed: false;
    }];
    readonly name: "Initialized";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "implementation";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "Upgraded";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "accountKeys";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "addDeposit";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "entryPoint";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IEntryPoint";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "dest";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "func";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "execute";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "dest";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }, {
        readonly name: "func";
        readonly internalType: "bytes[]";
        readonly type: "bytes[]";
    }];
    readonly name: "executeBatch";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getDeposit";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "accountKey";
        readonly internalType: "bytes32[2]";
        readonly type: "bytes32[2]";
    }];
    readonly name: "initialize";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "proxiableUUID";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newImplementation";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "upgradeTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newImplementation";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "data";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "upgradeToAndCall";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "missingAccountFunds";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "validateUserOp";
    readonly outputs: readonly [{
        readonly name: "validationData";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdrawDepositTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
export declare const baseAccountABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "entryPoint";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IEntryPoint";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "missingAccountFunds";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "validateUserOp";
    readonly outputs: readonly [{
        readonly name: "validationData";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}];
export declare const accountFactoryABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_entryPoint";
        readonly internalType: "contract IEntryPoint";
        readonly type: "address";
    }, {
        readonly name: "_sigVerifier";
        readonly internalType: "contract P256SHA256";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "accountImplementation";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract Account";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "accountKey";
        readonly internalType: "bytes32[2]";
        readonly type: "bytes32[2]";
    }, {
        readonly name: "salt";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "createAccount";
    readonly outputs: readonly [{
        readonly name: "ret";
        readonly internalType: "contract Account";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "accountKey";
        readonly internalType: "bytes32[2]";
        readonly type: "bytes32[2]";
    }, {
        readonly name: "salt";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getAddress";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
}];
export declare const accountFactoryAddress: "0xd633e2D9B05c54b1a267e8EBB4adF1f18ce73DB4";
export declare const accountFactoryConfig: {
    readonly address: "0xd633e2D9B05c54b1a267e8EBB4adF1f18ce73DB4";
    readonly abi: readonly [{
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
        readonly inputs: readonly [{
            readonly name: "_entryPoint";
            readonly internalType: "contract IEntryPoint";
            readonly type: "address";
        }, {
            readonly name: "_sigVerifier";
            readonly internalType: "contract P256SHA256";
            readonly type: "address";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "accountImplementation";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "contract Account";
            readonly type: "address";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "accountKey";
            readonly internalType: "bytes32[2]";
            readonly type: "bytes32[2]";
        }, {
            readonly name: "salt";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "createAccount";
        readonly outputs: readonly [{
            readonly name: "ret";
            readonly internalType: "contract Account";
            readonly type: "address";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "accountKey";
            readonly internalType: "bytes32[2]";
            readonly type: "bytes32[2]";
        }, {
            readonly name: "salt";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "getAddress";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
    }];
};
export declare const erc1967ProxyABI: readonly [{
    readonly stateMutability: "payable";
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_logic";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_data";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "previousAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "newAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AdminChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "beacon";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "BeaconUpgraded";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "implementation";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "Upgraded";
}, {
    readonly stateMutability: "payable";
    readonly type: "fallback";
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
export declare const erc1967UpgradeABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "previousAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "newAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AdminChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "beacon";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "BeaconUpgraded";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "implementation";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "Upgraded";
}];
export declare const erc20ABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "name_";
        readonly internalType: "string";
        readonly type: "string";
    }, {
        readonly name: "symbol_";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Approval";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Transfer";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "subtractedValue";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "decreaseAllowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "addedValue";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "increaseAllowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}];
export declare const entryPointABI: readonly [{
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "preOpGas";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "paid";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "validAfter";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }, {
        readonly name: "validUntil";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }, {
        readonly name: "targetSuccess";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "targetResult";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "ExecutionResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "opIndex";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly internalType: "string";
        readonly type: "string";
    }];
    readonly name: "FailedOp";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "SenderAddressResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "aggregator";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "SignatureValidationFailed";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "returnInfo";
        readonly internalType: "struct IEntryPoint.ReturnInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "preOpGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "prefund";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "sigFailed";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "validAfter";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "validUntil";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "paymasterContext";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "senderInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "factoryInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "paymasterInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }];
    readonly name: "ValidationResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "returnInfo";
        readonly internalType: "struct IEntryPoint.ReturnInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "preOpGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "prefund";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "sigFailed";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "validAfter";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "validUntil";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "paymasterContext";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "senderInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "factoryInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "paymasterInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "aggregatorInfo";
        readonly internalType: "struct IEntryPoint.AggregatorStakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "aggregator";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "stakeInfo";
            readonly internalType: "struct IStakeManager.StakeInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "stake";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "unstakeDelaySec";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }];
    }];
    readonly name: "ValidationResultWithAggregation";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "factory";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "paymaster";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AccountDeployed";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [];
    readonly name: "BeforeExecution";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalDeposit";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Deposited";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "aggregator";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "SignatureAggregatorChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalStaked";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeLocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeUnlocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeWithdrawn";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "paymaster";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "success";
        readonly internalType: "bool";
        readonly type: "bool";
        readonly indexed: false;
    }, {
        readonly name: "actualGasCost";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "actualGasUsed";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "UserOperationEvent";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "revertReason";
        readonly internalType: "bytes";
        readonly type: "bytes";
        readonly indexed: false;
    }];
    readonly name: "UserOperationRevertReason";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Withdrawn";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "SIG_VALIDATION_FAILED";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "initCode";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "paymasterAndData";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "_validateSenderAndPaymaster";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }];
    readonly name: "addStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "depositTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "deposits";
    readonly outputs: readonly [{
        readonly name: "deposit";
        readonly internalType: "uint112";
        readonly type: "uint112";
    }, {
        readonly name: "staked";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "stake";
        readonly internalType: "uint112";
        readonly type: "uint112";
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getDepositInfo";
    readonly outputs: readonly [{
        readonly name: "info";
        readonly internalType: "struct IStakeManager.DepositInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "deposit";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "staked";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "stake";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint32";
            readonly type: "uint32";
        }, {
            readonly name: "withdrawTime";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }];
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "initCode";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "getSenderAddress";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "getUserOpHash";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "opsPerAggregator";
        readonly internalType: "struct IEntryPoint.UserOpsPerAggregator[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "userOps";
            readonly internalType: "struct UserOperation[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "sender";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "nonce";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "initCode";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "callData";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "callGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "verificationGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "preVerificationGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "maxFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "maxPriorityFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "paymasterAndData";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "signature";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }];
        }, {
            readonly name: "aggregator";
            readonly internalType: "contract IAggregator";
            readonly type: "address";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "beneficiary";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "handleAggregatedOps";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "ops";
        readonly internalType: "struct UserOperation[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "beneficiary";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "handleOps";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "incrementNonce";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "callData";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }, {
        readonly name: "opInfo";
        readonly internalType: "struct EntryPoint.UserOpInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "mUserOp";
            readonly internalType: "struct EntryPoint.MemoryUserOp";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "sender";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "nonce";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "callGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "verificationGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "preVerificationGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "paymaster";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "maxFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "maxPriorityFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }, {
            readonly name: "userOpHash";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "prefund";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "contextOffset";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preOpGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "context";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "innerHandleOp";
    readonly outputs: readonly [{
        readonly name: "actualGasCost";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "nonceSequenceNumber";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "op";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "target";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "targetCallData";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "simulateHandleOp";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "simulateValidation";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "unlockStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "withdrawStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }, {
        readonly name: "withdrawAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdrawTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
export declare const ephemeralNotesABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_token";
        readonly internalType: "contract IERC20";
        readonly type: "address";
    }];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "note";
        readonly internalType: "struct Note";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "ephemeralOwner";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "from";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly indexed: false;
    }];
    readonly name: "NoteCreated";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "note";
        readonly internalType: "struct Note";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "ephemeralOwner";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "from";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly indexed: false;
    }];
    readonly name: "NoteRedeemed";
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_ephemeralOwner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_signature";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "claimNote";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_ephemeralOwner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "_amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "createNote";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "notes";
    readonly outputs: readonly [{
        readonly name: "ephemeralOwner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "token";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "contract IERC20";
        readonly type: "address";
    }];
}];
export declare const iAccountABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "missingAccountFunds";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "validateUserOp";
    readonly outputs: readonly [{
        readonly name: "validationData";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}];
export declare const iAggregatorABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOps";
        readonly internalType: "struct UserOperation[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "aggregateSignatures";
    readonly outputs: readonly [{
        readonly name: "aggregatedSignature";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOps";
        readonly internalType: "struct UserOperation[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "signature";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "validateSignatures";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "validateUserOpSignature";
    readonly outputs: readonly [{
        readonly name: "sigForUserOp";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
}];
export declare const iBeaconABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "implementation";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
}];
export declare const ierc20ABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Approval";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Transfer";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}];
export declare const ierc20MetadataABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Approval";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Transfer";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}];
export declare const iEntryPointABI: readonly [{
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "preOpGas";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "paid";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "validAfter";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }, {
        readonly name: "validUntil";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }, {
        readonly name: "targetSuccess";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "targetResult";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "ExecutionResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "opIndex";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "reason";
        readonly internalType: "string";
        readonly type: "string";
    }];
    readonly name: "FailedOp";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "SenderAddressResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "aggregator";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "SignatureValidationFailed";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "returnInfo";
        readonly internalType: "struct IEntryPoint.ReturnInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "preOpGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "prefund";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "sigFailed";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "validAfter";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "validUntil";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "paymasterContext";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "senderInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "factoryInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "paymasterInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }];
    readonly name: "ValidationResult";
}, {
    readonly type: "error";
    readonly inputs: readonly [{
        readonly name: "returnInfo";
        readonly internalType: "struct IEntryPoint.ReturnInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "preOpGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "prefund";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "sigFailed";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "validAfter";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "validUntil";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }, {
            readonly name: "paymasterContext";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "senderInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "factoryInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "paymasterInfo";
        readonly internalType: "struct IStakeManager.StakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "stake";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly name: "aggregatorInfo";
        readonly internalType: "struct IEntryPoint.AggregatorStakeInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "aggregator";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "stakeInfo";
            readonly internalType: "struct IStakeManager.StakeInfo";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly name: "stake";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "unstakeDelaySec";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }];
        }];
    }];
    readonly name: "ValidationResultWithAggregation";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "factory";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "paymaster";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AccountDeployed";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [];
    readonly name: "BeforeExecution";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalDeposit";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Deposited";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "aggregator";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "SignatureAggregatorChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalStaked";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeLocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeUnlocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeWithdrawn";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "paymaster";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "success";
        readonly internalType: "bool";
        readonly type: "bool";
        readonly indexed: false;
    }, {
        readonly name: "actualGasCost";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "actualGasUsed";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "UserOperationEvent";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "revertReason";
        readonly internalType: "bytes";
        readonly type: "bytes";
        readonly indexed: false;
    }];
    readonly name: "UserOperationRevertReason";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Withdrawn";
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }];
    readonly name: "addStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "depositTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getDepositInfo";
    readonly outputs: readonly [{
        readonly name: "info";
        readonly internalType: "struct IStakeManager.DepositInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "deposit";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "staked";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "stake";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint32";
            readonly type: "uint32";
        }, {
            readonly name: "withdrawTime";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }];
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "initCode";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "getSenderAddress";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "getUserOpHash";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "opsPerAggregator";
        readonly internalType: "struct IEntryPoint.UserOpsPerAggregator[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "userOps";
            readonly internalType: "struct UserOperation[]";
            readonly type: "tuple[]";
            readonly components: readonly [{
                readonly name: "sender";
                readonly internalType: "address";
                readonly type: "address";
            }, {
                readonly name: "nonce";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "initCode";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "callData";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "callGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "verificationGasLimit";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "preVerificationGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "maxFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "maxPriorityFeePerGas";
                readonly internalType: "uint256";
                readonly type: "uint256";
            }, {
                readonly name: "paymasterAndData";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }, {
                readonly name: "signature";
                readonly internalType: "bytes";
                readonly type: "bytes";
            }];
        }, {
            readonly name: "aggregator";
            readonly internalType: "contract IAggregator";
            readonly type: "address";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "beneficiary";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "handleAggregatedOps";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "ops";
        readonly internalType: "struct UserOperation[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "beneficiary";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "handleOps";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "incrementNonce";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "op";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "target";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "targetCallData";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "simulateHandleOp";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "simulateValidation";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "unlockStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "withdrawStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }, {
        readonly name: "withdrawAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdrawTo";
    readonly outputs: readonly [];
}];
export declare const iMulticall3ABI: readonly [{
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "aggregate";
    readonly outputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "returnData";
        readonly internalType: "bytes[]";
        readonly type: "bytes[]";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call3[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "allowFailure";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "aggregate3";
    readonly outputs: readonly [{
        readonly name: "returnData";
        readonly internalType: "struct IMulticall3.Result[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "success";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "returnData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call3Value[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "allowFailure";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "value";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "aggregate3Value";
    readonly outputs: readonly [{
        readonly name: "returnData";
        readonly internalType: "struct IMulticall3.Result[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "success";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "returnData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "blockAndAggregate";
    readonly outputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "blockHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "returnData";
        readonly internalType: "struct IMulticall3.Result[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "success";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "returnData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getBasefee";
    readonly outputs: readonly [{
        readonly name: "basefee";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "getBlockHash";
    readonly outputs: readonly [{
        readonly name: "blockHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getBlockNumber";
    readonly outputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getChainId";
    readonly outputs: readonly [{
        readonly name: "chainid";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getCurrentBlockCoinbase";
    readonly outputs: readonly [{
        readonly name: "coinbase";
        readonly internalType: "address";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getCurrentBlockDifficulty";
    readonly outputs: readonly [{
        readonly name: "difficulty";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getCurrentBlockGasLimit";
    readonly outputs: readonly [{
        readonly name: "gaslimit";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getCurrentBlockTimestamp";
    readonly outputs: readonly [{
        readonly name: "timestamp";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "addr";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getEthBalance";
    readonly outputs: readonly [{
        readonly name: "balance";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "getLastBlockHash";
    readonly outputs: readonly [{
        readonly name: "blockHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "requireSuccess";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "tryAggregate";
    readonly outputs: readonly [{
        readonly name: "returnData";
        readonly internalType: "struct IMulticall3.Result[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "success";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "returnData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "requireSuccess";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "calls";
        readonly internalType: "struct IMulticall3.Call[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "target";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
    readonly name: "tryBlockAndAggregate";
    readonly outputs: readonly [{
        readonly name: "blockNumber";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }, {
        readonly name: "blockHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "returnData";
        readonly internalType: "struct IMulticall3.Result[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "success";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "returnData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }];
}];
export declare const iPaymasterABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "mode";
        readonly internalType: "enum IPaymaster.PostOpMode";
        readonly type: "uint8";
    }, {
        readonly name: "context";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }, {
        readonly name: "actualGasCost";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "postOp";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "userOp";
        readonly internalType: "struct UserOperation";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "sender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "nonce";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "initCode";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "callGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "verificationGasLimit";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "preVerificationGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "maxPriorityFeePerGas";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }, {
            readonly name: "paymasterAndData";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
    }, {
        readonly name: "userOpHash";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "maxCost";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "validatePaymasterUserOp";
    readonly outputs: readonly [{
        readonly name: "context";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }, {
        readonly name: "validationData";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}];
export declare const iStakeManagerABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalDeposit";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Deposited";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalStaked";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeLocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeUnlocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeWithdrawn";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Withdrawn";
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "_unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }];
    readonly name: "addStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "depositTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getDepositInfo";
    readonly outputs: readonly [{
        readonly name: "info";
        readonly internalType: "struct IStakeManager.DepositInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "deposit";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "staked";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "stake";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint32";
            readonly type: "uint32";
        }, {
            readonly name: "withdrawTime";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }];
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "unlockStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "withdrawStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }, {
        readonly name: "withdrawAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdrawTo";
    readonly outputs: readonly [];
}];
export declare const initializableABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "version";
        readonly internalType: "uint8";
        readonly type: "uint8";
        readonly indexed: false;
    }];
    readonly name: "Initialized";
}];
export declare const nameRegistryABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "name";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
        readonly indexed: true;
    }, {
        readonly name: "addr";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "Registered";
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }, {
        readonly name: "addr";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "register";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
    readonly name: "resolveAddr";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "addr";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "resolveName";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}];
export declare const nameRegistryAddress: "0x57480303768F533AaADa9207Ec2E4064BaEE0Fe6";
export declare const nameRegistryConfig: {
    readonly address: "0x57480303768F533AaADa9207Ec2E4064BaEE0Fe6";
    readonly abi: readonly [{
        readonly type: "event";
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly name: "name";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
            readonly indexed: true;
        }, {
            readonly name: "addr";
            readonly internalType: "address";
            readonly type: "address";
            readonly indexed: true;
        }];
        readonly name: "Registered";
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }, {
            readonly name: "addr";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "register";
        readonly outputs: readonly [];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }];
        readonly name: "resolveAddr";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "address";
            readonly type: "address";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "addr";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "resolveName";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bytes32";
            readonly type: "bytes32";
        }];
    }];
};
export declare const iNonceManagerABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "incrementNonce";
    readonly outputs: readonly [];
}];
export declare const nonceManagerABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "getNonce";
    readonly outputs: readonly [{
        readonly name: "nonce";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "incrementNonce";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "";
        readonly internalType: "uint192";
        readonly type: "uint192";
    }];
    readonly name: "nonceSequenceNumber";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}];
export declare const p256Sha256ABI: readonly [{
    readonly stateMutability: "pure";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly internalType: "bytes32[2]";
        readonly type: "bytes32[2]";
    }, {
        readonly name: "data";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }, {
        readonly name: "signature";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "verify";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}];
export declare const p256Sha256Address: "0x40Daf4F17CD892A87f0A9BA3A672AB8eaD585cf0";
export declare const p256Sha256Config: {
    readonly address: "0x40Daf4F17CD892A87f0A9BA3A672AB8eaD585cf0";
    readonly abi: readonly [{
        readonly stateMutability: "pure";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "key";
            readonly internalType: "bytes32[2]";
            readonly type: "bytes32[2]";
        }, {
            readonly name: "data";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }, {
            readonly name: "signature";
            readonly internalType: "bytes";
            readonly type: "bytes";
        }];
        readonly name: "verify";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }];
};
export declare const proxyABI: readonly [{
    readonly stateMutability: "payable";
    readonly type: "fallback";
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
export declare const senderCreatorABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "initCode";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "createSender";
    readonly outputs: readonly [{
        readonly name: "sender";
        readonly internalType: "address";
        readonly type: "address";
    }];
}];
export declare const stakeManagerABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalDeposit";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Deposited";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "totalStaked";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeLocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeUnlocked";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "StakeWithdrawn";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "withdrawAddress";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Withdrawn";
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }];
    readonly name: "addStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "depositTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "deposits";
    readonly outputs: readonly [{
        readonly name: "deposit";
        readonly internalType: "uint112";
        readonly type: "uint112";
    }, {
        readonly name: "staked";
        readonly internalType: "bool";
        readonly type: "bool";
    }, {
        readonly name: "stake";
        readonly internalType: "uint112";
        readonly type: "uint112";
    }, {
        readonly name: "unstakeDelaySec";
        readonly internalType: "uint32";
        readonly type: "uint32";
    }, {
        readonly name: "withdrawTime";
        readonly internalType: "uint48";
        readonly type: "uint48";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "getDepositInfo";
    readonly outputs: readonly [{
        readonly name: "info";
        readonly internalType: "struct IStakeManager.DepositInfo";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "deposit";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "staked";
            readonly internalType: "bool";
            readonly type: "bool";
        }, {
            readonly name: "stake";
            readonly internalType: "uint112";
            readonly type: "uint112";
        }, {
            readonly name: "unstakeDelaySec";
            readonly internalType: "uint32";
            readonly type: "uint32";
        }, {
            readonly name: "withdrawTime";
            readonly internalType: "uint48";
            readonly type: "uint48";
        }];
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "unlockStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }];
    readonly name: "withdrawStake";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "withdrawAddress";
        readonly internalType: "address payable";
        readonly type: "address";
    }, {
        readonly name: "withdrawAmount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "withdrawTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
export declare const stdInvariantABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "excludeArtifacts";
    readonly outputs: readonly [{
        readonly name: "excludedArtifacts_";
        readonly internalType: "string[]";
        readonly type: "string[]";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "excludeContracts";
    readonly outputs: readonly [{
        readonly name: "excludedContracts_";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "excludeSenders";
    readonly outputs: readonly [{
        readonly name: "excludedSenders_";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "targetArtifactSelectors";
    readonly outputs: readonly [{
        readonly name: "targetedArtifactSelectors_";
        readonly internalType: "struct StdInvariant.FuzzSelector[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "addr";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "selectors";
            readonly internalType: "bytes4[]";
            readonly type: "bytes4[]";
        }];
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "targetArtifacts";
    readonly outputs: readonly [{
        readonly name: "targetedArtifacts_";
        readonly internalType: "string[]";
        readonly type: "string[]";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "targetContracts";
    readonly outputs: readonly [{
        readonly name: "targetedContracts_";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "targetSelectors";
    readonly outputs: readonly [{
        readonly name: "targetedSelectors_";
        readonly internalType: "struct StdInvariant.FuzzSelector[]";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "addr";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "selectors";
            readonly internalType: "bytes4[]";
            readonly type: "bytes4[]";
        }];
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "targetSenders";
    readonly outputs: readonly [{
        readonly name: "targetedSenders_";
        readonly internalType: "address[]";
        readonly type: "address[]";
    }];
}];
export declare const testUsdcABI: readonly [{
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
    readonly inputs: readonly [];
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Approval";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly internalType: "uint256";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly name: "Transfer";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "pure";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint8";
        readonly type: "uint8";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "subtractedValue";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "decreaseAllowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "addedValue";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "increaseAllowance";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "string";
        readonly type: "string";
    }];
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "to";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly internalType: "uint256";
        readonly type: "uint256";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bool";
        readonly type: "bool";
    }];
}];
export declare const testUsdcAddress: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf";
export declare const testUsdcConfig: {
    readonly address: "0x1B85deDe8178E18CdE599B4C9d913534553C3dBf";
    readonly abi: readonly [{
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
        readonly inputs: readonly [];
    }, {
        readonly type: "event";
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly internalType: "address";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "spender";
            readonly internalType: "address";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "value";
            readonly internalType: "uint256";
            readonly type: "uint256";
            readonly indexed: false;
        }];
        readonly name: "Approval";
    }, {
        readonly type: "event";
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly name: "from";
            readonly internalType: "address";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "to";
            readonly internalType: "address";
            readonly type: "address";
            readonly indexed: true;
        }, {
            readonly name: "value";
            readonly internalType: "uint256";
            readonly type: "uint256";
            readonly indexed: false;
        }];
        readonly name: "Transfer";
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "spender";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "allowance";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "spender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "approve";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly internalType: "address";
            readonly type: "address";
        }];
        readonly name: "balanceOf";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly stateMutability: "pure";
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "decimals";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "uint8";
            readonly type: "uint8";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "spender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "subtractedValue";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "decreaseAllowance";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "spender";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "addedValue";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "increaseAllowance";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "name";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "string";
            readonly type: "string";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "symbol";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "string";
            readonly type: "string";
        }];
    }, {
        readonly stateMutability: "view";
        readonly type: "function";
        readonly inputs: readonly [];
        readonly name: "totalSupply";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "transfer";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }, {
        readonly stateMutability: "nonpayable";
        readonly type: "function";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly internalType: "address";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly internalType: "uint256";
            readonly type: "uint256";
        }];
        readonly name: "transferFrom";
        readonly outputs: readonly [{
            readonly name: "";
            readonly internalType: "bool";
            readonly type: "bool";
        }];
    }];
};
export declare const uupsUpgradeableABI: readonly [{
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "previousAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "newAdmin";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: false;
    }];
    readonly name: "AdminChanged";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "beacon";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "BeaconUpgraded";
}, {
    readonly type: "event";
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly name: "implementation";
        readonly internalType: "address";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly name: "Upgraded";
}, {
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "proxiableUUID";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}, {
    readonly stateMutability: "nonpayable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newImplementation";
        readonly internalType: "address";
        readonly type: "address";
    }];
    readonly name: "upgradeTo";
    readonly outputs: readonly [];
}, {
    readonly stateMutability: "payable";
    readonly type: "function";
    readonly inputs: readonly [{
        readonly name: "newImplementation";
        readonly internalType: "address";
        readonly type: "address";
    }, {
        readonly name: "data";
        readonly internalType: "bytes";
        readonly type: "bytes";
    }];
    readonly name: "upgradeToAndCall";
    readonly outputs: readonly [];
}];
export declare const ierc1822ProxiableABI: readonly [{
    readonly stateMutability: "view";
    readonly type: "function";
    readonly inputs: readonly [];
    readonly name: "proxiableUUID";
    readonly outputs: readonly [{
        readonly name: "";
        readonly internalType: "bytes32";
        readonly type: "bytes32";
    }];
}];
