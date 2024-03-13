import { View } from "react-native";

import { Account } from "../../model/account";
import { useWithAccount } from "../shared/withAccount";

export default function NotificationsScreen() {
  const Inner = useWithAccount(NotificationsScreenInner);
  return <Inner />;
}

function NotificationsScreenInner({ account }: { account: Account }) {
  return <View />;
}
