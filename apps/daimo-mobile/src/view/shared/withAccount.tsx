import { useEffect } from "react";

import { useNav } from "./nav";
import { Account, useAccount } from "../../model/account";

/// Higher-order component that provides an account to the wrapped component.
/// If no account is present, redirects to onboarding.
export function withAccount<P extends { account: Account }>(
  Component: React.ComponentType<P>
) {
  return function WithAccount(props: Omit<P, "account">) {
    const [account] = useAccount();

    const nav = useNav();
    useEffect(() => {
      if (account == null) nav.navigate("HomeTab", { screen: "Home" });
    }, [account == null]);

    if (account == null) {
      return null;
    } else {
      return <Component {...(props as P)} account={account} />;
    }
  };
}
