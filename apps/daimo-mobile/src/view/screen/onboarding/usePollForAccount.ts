import { useEffect } from "react";

import { useOnboardingNav } from "../../../common/nav";
import { getAccountManager, useAccount } from "../../../logic/accountManager";
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
  const [account] = useAccount();
  useEffect(() => {
    if (account == null) return;
    console.log(`[ONBOARDING] found account ${account.name}, request notifs`);
    if (account != null) nav.navigate("AllowNotifs");
  }, [account == null]);
}
