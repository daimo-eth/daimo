import { assert } from "@daimo/common";
import { useEffect } from "react";

import { useOnboardingNav } from "../../../common/nav";
import {
  getAccountManager,
  useAccountAndKeyInfo,
} from "../../../logic/accountManager";
import { useTime } from "../../../logic/time";

// Onboarding: poll for account based on our signing key.
export function usePollForAccount() {
  const ts = useTime(2);
  useEffect(() => {
    getAccountManager().pollForAccountByKey();
  }, [ts]);

  // If we find an account, jump directly to the end of onboarding.
  // This happens in the Use Existing flow, or on app reinstall.
  const nav = useOnboardingNav();
  const navState = nav.getState();
  const { account, keyInfo, isReinstalledApp } = useAccountAndKeyInfo();
  useEffect(() => {
    if (account == null) return;
    if (navState == null) return;
    assert(keyInfo != null, "No keyInfo");

    console.log(`[ONBOARDING] polling found account ${account.name}`);
    const page = navState.routes[navState.index].name;
    console.log(`[ONBOARDING] onboarding page ${page}, maybe jumping forward`);

    if (page === "Finish") return;

    if (isReinstalledApp) {
      nav.navigate("ExistingReinstall");
    } else {
      nav.navigate("AllowNotifs", { showProgressBar: false });
    }
  }, [account == null, navState == null]);
}
