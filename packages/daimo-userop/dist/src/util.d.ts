export declare const publicClient: {
    chain: {
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    };
    key: string;
    name: string;
    pollingInterval: number;
    request: import("viem").EIP1193RequestFn<import("viem").PublicRpcSchema>;
    transport: import("viem").TransportConfig<"http", import("viem").EIP1193RequestFn> & {
        url?: string | undefined;
    };
    type: string;
    uid: string;
    batch?: {
        multicall?: boolean | import("viem/dist/types/clients/createPublicClient").MulticallBatchOptions | undefined;
    } | undefined;
    call: (parameters: import("viem").CallParameters<{
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }>) => Promise<import("viem").CallReturnType>;
    createBlockFilter: () => Promise<{
        id: `0x${string}`;
        request: import("viem").EIP1193RequestFn<readonly [{
            Method: "eth_getFilterChanges";
            Parameters: [filterId: `0x${string}`];
            ReturnType: `0x${string}`[] | import("viem").RpcLog[];
        }, {
            Method: "eth_getFilterLogs";
            Parameters: [filterId: `0x${string}`];
            ReturnType: import("viem").RpcLog[];
        }, {
            Method: "eth_uninstallFilter";
            Parameters: [filterId: `0x${string}`];
            ReturnType: boolean;
        }]>;
        type: "block";
    }>;
    createContractEventFilter: <TAbi extends import("viem").Abi | readonly unknown[], TEventName extends string | undefined, TArgs extends import("viem/dist/types/types/contract").MaybeExtractEventArgsFromAbi<TAbi, TEventName> | undefined, TStrict extends boolean | undefined = undefined>(args: import("viem").CreateContractEventFilterParameters<TAbi, TEventName, TArgs, TStrict>) => Promise<import("viem").CreateContractEventFilterReturnType<TAbi, TEventName, TArgs, TStrict>>;
    createEventFilter: <TAbiEvent extends import("abitype").AbiEvent | undefined, TStrict_1 extends boolean | undefined = undefined, _Abi extends import("viem").Abi | readonly unknown[] = [TAbiEvent], _EventName extends string | undefined = import("viem/dist/types/types/contract").MaybeAbiEventName<TAbiEvent>, _Args extends import("viem/dist/types/types/contract").MaybeExtractEventArgsFromAbi<_Abi, _EventName> | undefined = undefined>(args?: import("viem").CreateEventFilterParameters<TAbiEvent, TStrict_1, _Abi, _EventName, _Args> | undefined) => Promise<import("viem/dist/types/types/filter").Filter<"event", _Abi, _EventName, _Args, TStrict_1> extends infer T ? { [K in keyof T]: import("viem/dist/types/types/filter").Filter<"event", _Abi, _EventName, _Args, TStrict_1>[K]; } : never>;
    createPendingTransactionFilter: () => Promise<{
        id: `0x${string}`;
        request: import("viem").EIP1193RequestFn<readonly [{
            Method: "eth_getFilterChanges";
            Parameters: [filterId: `0x${string}`];
            ReturnType: `0x${string}`[] | import("viem").RpcLog[];
        }, {
            Method: "eth_getFilterLogs";
            Parameters: [filterId: `0x${string}`];
            ReturnType: import("viem").RpcLog[];
        }, {
            Method: "eth_uninstallFilter";
            Parameters: [filterId: `0x${string}`];
            ReturnType: boolean;
        }]>;
        type: "transaction";
    }>;
    estimateContractGas: <TChain extends import("viem").Chain | undefined, TAbi_1 extends import("viem").Abi | readonly unknown[], TFunctionName extends string>(args: import("viem").EstimateContractGasParameters<TAbi_1, TFunctionName, TChain>) => Promise<bigint>;
    estimateGas: (args: import("viem").EstimateGasParameters<{
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }>) => Promise<bigint>;
    getBalance: (args: import("viem").GetBalanceParameters) => Promise<bigint>;
    getBlock: (args?: import("viem").GetBlockParameters | undefined) => Promise<import("viem").Block>;
    getBlockNumber: (args?: import("viem").GetBlockNumberParameters | undefined) => Promise<bigint>;
    getBlockTransactionCount: (args?: import("viem").GetBlockTransactionCountParameters | undefined) => Promise<number>;
    getBytecode: (args: import("viem").GetBytecodeParameters) => Promise<import("viem").GetBytecodeReturnType>;
    getChainId: () => Promise<number>;
    getEnsAddress: (args: {
        blockNumber?: bigint | undefined;
        blockTag?: import("viem").BlockTag | undefined;
        name: string;
        universalResolverAddress?: `0x${string}` | undefined;
    }) => Promise<import("viem").GetEnsAddressReturnType>;
    getEnsAvatar: (args: {
        name: string;
        blockNumber?: bigint | undefined;
        blockTag?: import("viem").BlockTag | undefined;
        universalResolverAddress?: `0x${string}` | undefined;
        gatewayUrls?: import("viem").AssetGatewayUrls | undefined;
    }) => Promise<import("viem/dist/types/actions/ens/getEnsAvatar").GetEnsAvatarReturnType>;
    getEnsName: (args: {
        blockNumber?: bigint | undefined;
        blockTag?: import("viem").BlockTag | undefined;
        address: `0x${string}`;
        universalResolverAddress?: `0x${string}` | undefined;
    }) => Promise<import("viem").GetEnsNameReturnType>;
    getEnsResolver: (args: {
        blockNumber?: bigint | undefined;
        blockTag?: import("viem").BlockTag | undefined;
        name: string;
        universalResolverAddress?: `0x${string}` | undefined;
    }) => Promise<`0x${string}`>;
    getEnsText: (args: {
        blockNumber?: bigint | undefined;
        blockTag?: import("viem").BlockTag | undefined;
        name: string;
        key: string;
        universalResolverAddress?: `0x${string}` | undefined;
    }) => Promise<import("viem/dist/types/actions/ens/getEnsText").GetEnsTextReturnType>;
    getFeeHistory: (args: import("viem").GetFeeHistoryParameters) => Promise<import("viem").GetFeeHistoryReturnType>;
    getFilterChanges: <TFilterType extends import("viem/dist/types/types/filter").FilterType, TAbi_2 extends import("viem").Abi | readonly unknown[], TEventName_1 extends string | undefined, TStrict_2 extends boolean | undefined = undefined>(args: import("viem").GetFilterChangesParameters<TFilterType, TAbi_2, TEventName_1, TStrict_2>) => Promise<import("viem").GetFilterChangesReturnType<TFilterType, TAbi_2, TEventName_1, TStrict_2>>;
    getFilterLogs: <TAbi_3 extends import("viem").Abi | readonly unknown[], TEventName_2 extends string | undefined, TStrict_3 extends boolean | undefined = undefined>(args: import("viem").GetFilterLogsParameters<TAbi_3, TEventName_2, TStrict_3>) => Promise<import("viem").GetFilterLogsReturnType<TAbi_3, TEventName_2, TStrict_3>>;
    getGasPrice: () => Promise<bigint>;
    getLogs: <TAbiEvent_1 extends import("abitype").AbiEvent | undefined, TStrict_4 extends boolean | undefined = undefined>(args?: import("viem").GetLogsParameters<TAbiEvent_1, TStrict_4> | undefined) => Promise<import("viem").GetLogsReturnType<TAbiEvent_1, TStrict_4>>;
    getStorageAt: (args: import("viem").GetStorageAtParameters) => Promise<import("viem").GetStorageAtReturnType>;
    getTransaction: (args: import("viem").GetTransactionParameters) => Promise<import("viem").Transaction>;
    getTransactionConfirmations: (args: import("viem").GetTransactionConfirmationsParameters<{
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }>) => Promise<bigint>;
    getTransactionCount: (args: import("viem").GetTransactionCountParameters) => Promise<number>;
    getTransactionReceipt: (args: import("viem").GetTransactionReceiptParameters) => Promise<import("viem").TransactionReceipt>;
    multicall: <TContracts extends import("viem").ContractFunctionConfig[], TAllowFailure extends boolean = true>(args: import("viem").MulticallParameters<TContracts, TAllowFailure>) => Promise<import("viem").MulticallReturnType<TContracts, TAllowFailure>>;
    readContract: <TAbi_4 extends import("viem").Abi | readonly unknown[], TFunctionName_1 extends string>(args: import("viem").ReadContractParameters<TAbi_4, TFunctionName_1>) => Promise<import("viem").ReadContractReturnType<TAbi_4, TFunctionName_1>>;
    simulateContract: <TAbi_5 extends import("viem").Abi | readonly unknown[] = import("viem").Abi, TFunctionName_2 extends string = any, TChainOverride extends import("viem").Chain | undefined = undefined>(args: import("viem").SimulateContractParameters<TAbi_5, TFunctionName_2, {
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }, TChainOverride>) => Promise<import("viem").SimulateContractReturnType<TAbi_5, TFunctionName_2, {
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }, TChainOverride>>;
    verifyMessage: (args: import("viem/dist/types/actions/public/verifyMessage").VerifyMessageParameters) => Promise<boolean>;
    verifyTypedData: (args: import("viem/dist/types/actions/public/verifyTypedData").VerifyTypedDataParameters) => Promise<boolean>;
    uninstallFilter: (args: import("viem").UninstallFilterParameters) => Promise<boolean>;
    waitForTransactionReceipt: (args: import("viem").WaitForTransactionReceiptParameters<{
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }>) => Promise<import("viem").TransactionReceipt>;
    watchBlockNumber: (args: import("viem").WatchBlockNumberParameters) => import("viem").WatchBlockNumberReturnType;
    watchBlocks: (args: import("viem").WatchBlocksParameters<import("viem").HttpTransport, {
        readonly id: 84531;
        readonly network: "base-goerli";
        readonly name: "Base Goerli";
        readonly nativeCurrency: {
            readonly name: "Base Goerli";
            readonly symbol: "ETH";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://goerli.base.org"];
            };
            readonly public: {
                readonly http: readonly ["https://goerli.base.org"];
            };
        };
        readonly blockExplorers: {
            readonly etherscan: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
            readonly default: {
                readonly name: "Basescan";
                readonly url: "https://goerli.basescan.org";
            };
        };
        readonly testnet: true;
    }>) => import("viem").WatchBlocksReturnType;
    watchContractEvent: <TAbi_6 extends import("viem").Abi | readonly unknown[], TEventName_3 extends string, TStrict_5 extends boolean | undefined = undefined>(args: import("viem").WatchContractEventParameters<TAbi_6, TEventName_3, TStrict_5>) => import("viem").WatchContractEventReturnType;
    watchEvent: <TAbiEvent_2 extends import("abitype").AbiEvent | undefined, TStrict_6 extends boolean | undefined = undefined>(args: import("viem").WatchEventParameters<TAbiEvent_2, TStrict_6>) => import("viem").WatchEventReturnType;
    watchPendingTransactions: (args: import("viem").WatchPendingTransactionsParameters<import("viem").HttpTransport>) => import("viem").WatchPendingTransactionsReturnType;
};
export declare const dummySignature = "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead";
export type SigningCallback = (hexMessage: string) => Promise<string>;
