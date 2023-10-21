import { chainConfig } from "@daimo/contract";
import { useEffect } from "react";

import { useActStatus } from "./actStatus";
import { useLoadOrCreateEnclaveKey } from "./key";
import { createEmptyAccount } from "../logic/account";
import { useTime } from "../logic/time";
import { rpcFunc } from "../logic/trpc";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount() {
  const [as, setAS] = useActStatus();

  const enclaveKeyName = defaultEnclaveKeyName;
  const pubKeyHex = useLoadOrCreateEnclaveKey(setAS, enclaveKeyName);

  const ts = useTime(2);

  // Once account is found, save the account
  const [, setAccount] = useAccount();

  // TODO: Does TRPC have a better way to "watch" an endpoint?
  useEffect(() => {
    (async () => {
      if (!pubKeyHex) return; // Hasn't started

      const result = await rpcFunc.lookupEthereumAccountByKey.query({
        pubKeyHex,
      });

      if (result && result.name) {
        console.log(`[ACTION] loaded account ${result.name} at ${result.addr}`);
        setAccount(
          createEmptyAccount({
            enclaveKeyName,
            enclavePubKey: pubKeyHex,
            name: result.name,
            address: result.addr,
          })
        );
        setAS("success", "Found account");
      }
    })();
  }, [ts]);

  return { ...as, pubKeyHex };
}
