import { View } from "react-native";

import { useNav } from "../../common/nav";
import { Account } from "../../model/account";
import { ScreenHeader } from "../shared/ScreenHeader";
import { useWithAccount } from "../shared/withAccount";

export function NotificationsScreen() {
  const Inner = useWithAccount(NotificationsScreenInner);
  return <Inner />;
}

function NotificationsScreenInner({ account }: { account: Account }) {
  const nav = useNav();

  const goBack = () => {
    nav.goBack();
  };

  return (
    <View>
      <ScreenHeader title="Notifications" onBack={goBack} />
    </View>
  );
}
