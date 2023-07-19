import { useEffect, useState } from "react";
import { Hex } from "viem";

import { useActStatus } from "./actStatus";
import { createKey } from "./useCreateAccount";
import { defaultEnclaveKeyName } from "../model/account";

export function useExistingAccount() {
  const [as, setAS] = useActStatus();

  // Create enclave key immediately, in the idle state
  const enclaveKeyName = defaultEnclaveKeyName;
  const [pubKeyHex, setPubKeyHex] = useState<Hex>();
  useEffect(() => {
    createKey(setAS, enclaveKeyName).then(setPubKeyHex);
  }, []);

  const exec = async () => {
    if (!pubKeyHex) return;
    // TODO: load account
    setAS("success", "Account loaded");
  };

  return { ...as, pubKeyHex, exec };
}
