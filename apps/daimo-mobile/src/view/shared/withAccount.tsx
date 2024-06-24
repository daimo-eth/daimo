import { useEffect, useMemo } from "react";

import { useNav } from "../../common/nav";
import { useAccount } from "../../logic/accountManager";
import { Account } from "../../storage/account";

/// Higher-order component that provides an account to the wrapped component.
/// If no account is present, redirects to onboarding.
export function useWithAccount<P extends { account: Account }>(
  Component: React.ComponentType<P>
) {
  return useMemo(
    () =>
      function WithAccount(props: Omit<P, "account">) {
        const account = useAccount();

        const nav = useNav();
        useEffect(() => {
          if (account == null) nav.navigate("HomeTab", { screen: "Home" });
        }, [account == null]);

        if (account == null) {
          return null;
        } else {
          return <Component {...(props as P)} account={account} />;
        }
      },
    []
  );
}
