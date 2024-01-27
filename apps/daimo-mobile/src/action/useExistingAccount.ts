import { DaimoChain } from "@daimo/contract";
import { useEffect } from "react";

import { useActStatus } from "./actStatus";
import { DeviceKeyStatus } from "./key";
import { createEmptyAccount } from "../logic/account";
import { env } from "../logic/env";
import { useTime } from "../logic/time";
import { defaultEnclaveKeyName, useAccount } from "../model/account";

export function useExistingAccount(
  daimoChain: DaimoChain,
  keyStatus: DeviceKeyStatus
) {
  const [as, setAS] = useActStatus();

  const enclaveKeyName = defaultEnclaveKeyName;
  const rpcFunc = env(daimoChain).rpcFunc;

  const ts = useTime(2);

  // Once account is found, save the account
  const [account, setAccount] = useAccount();

  // Set account status if key status changes
  useEffect(() => {
    setAS(keyStatus.status, keyStatus.message);
  }, [keyStatus.status]);

  // TODO: Does TRPC have a better way to "watch" an endpoint?
  useEffect(() => {
    (async () => {
      if (account || !keyStatus.pubKeyHex) return; // Either hasn't started or already loaded

      const result = await rpcFunc.lookupEthereumAccountByKey.query({
        pubKeyHex: keyStatus.pubKeyHex,
      });

      if (result && result.name) {
        console.log(`[ACTION] loaded account ${result.name} at ${result.addr}`);
        setAccount(
          createEmptyAccount(
            {
              enclaveKeyName,
              enclavePubKey: keyStatus.pubKeyHex,
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

  return as;
}
