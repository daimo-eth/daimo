import { chainConfig, daimoPaymasterAddress } from "@daimo/contract";
import { useEffect } from "react";

import { useActStatus } from "./actStatus";
import { useLoadOrCreateEnclaveKey } from "./key";
import { useTime } from "../logic/time";
import { rpcFunc } from "../logic/trpc";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount() {
  const [as, setAS] = useActStatus();

  const enclaveKeyName = defaultEnclaveKeyName;
  const pubKeyHex = useLoadOrCreateEnclaveKey(setAS, enclaveKeyName);

  const ts = useTime(2);

  // Once account is found, save the account
  const [account, setAccount] = useAccount();

  // TODO: Does TRPC have a better way to "watch" an endpoint?
  useEffect(() => {
    (async () => {
      if (account || !pubKeyHex) return; // Either hasn't started or already loaded

      const result = await rpcFunc.lookupEthereumAccountByKey.query({
        pubKeyHex,
      });

      if (result && result.name) {
        console.log(`[ACTION] loaded account ${result.name} at ${result.addr}`);
        setAccount({
          enclaveKeyName,
          enclavePubKey: pubKeyHex,
          name: result.name,
          address: result.addr,

          // No possibility of mismatch since API is locked to same chain
          homeChainId: chainConfig.chainL2.id,
          homeCoinAddress: chainConfig.tokenAddress,

          // These populate on sync with server
          lastBalance: BigInt(0),
          lastBlockTimestamp: 0,
          lastBlock: 0,
          lastFinalizedBlock: 0,

          namedAccounts: [],
          recentTransfers: [],
          trackedRequests: [],
          accountKeys: [],

          chainGasConstants: {
            maxPriorityFeePerGas: "0",
            maxFeePerGas: "0",
            estimatedFee: 0,
            paymasterAddress: daimoPaymasterAddress,
          },

          pushToken: null,
        });
        setAS("success", "Found account");
      }
    })();
  }, [ts]);

  return { ...as, pubKeyHex };
}
