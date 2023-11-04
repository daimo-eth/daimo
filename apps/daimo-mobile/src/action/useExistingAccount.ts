import { DaimoChain } from "@daimo/contract";
import { useEffect } from "react";

import { useActStatus } from "./actStatus";
import { useLoadOrCreateEnclaveKey } from "./key";
import { createEmptyAccount } from "../logic/account";
import { env } from "../logic/env";
import { useTime } from "../logic/time";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount(daimoChain: DaimoChain) {
  const [as, setAS] = useActStatus();

  const enclaveKeyName = defaultEnclaveKeyName;
  const pubKeyHex = useLoadOrCreateEnclaveKey(setAS, enclaveKeyName);
  const rpcFunc = env(daimoChain).rpcFunc;

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
        setAccount(
          createEmptyAccount(
            {
              enclaveKeyName,
              enclavePubKey: pubKeyHex,
              name: result.name,
              address: result.addr,
            },
            daimoChain
          )
        );
        setAS("success", "Found account");
      }
    })();
  }, [ts]);

  return { ...as, pubKeyHex };
}
