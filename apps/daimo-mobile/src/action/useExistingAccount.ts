import { useEffect } from "react";

import { useActStatus } from "./actStatus";
import { useLoadOrCreateEnclaveKey } from "./key";
import { rpcFunc } from "../logic/trpc";
import { useTime } from "../logic/useTime";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount(forceWeakerKeys: boolean) {
  const [as, setAS] = useActStatus();

  const enclaveKeyInfo = {
    name: defaultEnclaveKeyName,
    forceWeakerKeys,
  };
  const pubKeyHex = useLoadOrCreateEnclaveKey(setAS, enclaveKeyInfo);

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
          enclaveKeyInfo,
          enclavePubKey: pubKeyHex,
          name: result.name,
          address: result.addr,

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
            paymasterAndData: "0x",
          },

          pushToken: null,
        });
        setAS("success", "Found account");
      }
    })();
  }, [ts]);

  return { ...as, pubKeyHex };
}
