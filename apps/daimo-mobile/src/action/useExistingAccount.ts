import { useEffect, useState } from "react";
import { Hex } from "viem";

import { useActStatus } from "./actStatus";
import { createKey } from "./useCreateAccount";
import { useTime } from "../logic/time";
import { rpcFunc } from "../logic/trpc";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount() {
  const [as, setAS] = useActStatus();

  // Create enclave key immediately, in the idle state
  const enclaveKeyName = defaultEnclaveKeyName;
  const [pubKeyHex, setPubKeyHex] = useState<Hex>();
  const ts = useTime(2);

  // Once account creation succeeds, save the account
  const [account, setAccount] = useAccount();
  useEffect(() => {
    createKey(setAS, enclaveKeyName).then(setPubKeyHex);
  }, []);

  useEffect(() => {
    (async () => {
      if (account || !pubKeyHex) return; // Either hasn't started or already loaded
      const result = await rpcFunc.lookupEthereumAccountByKey.query({
        pubKeyHex,
      });

      if (result && result.name) {
        console.log(`[CHAIN] loaded account ${result.name} at ${result.addr}`);
        setAccount({
          enclaveKeyName,
          name: result.name,
          address: result.addr,

          // These populate on resync with server
          lastBalance: BigInt(0),
          lastBlockTimestamp: 0,
          lastBlock: 0,
          lastFinalizedBlock: 0,

          namedAccounts: [],
          recentTransfers: [],

          pushToken: null,
        });
        setAS("success", "Found account");
      }
    })();
  }, [ts]);

  return { ...as, pubKeyHex };
}
