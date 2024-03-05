import Octicons from "@expo/vector-icons/Octicons";
import { useState } from "react";
import { Platform, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Spacer from "./Spacer";
import { color } from "./style";
import { TextBody } from "./text";
import { useNetworkState } from "../../sync/networkState";
import { resync } from "../../sync/sync";

/// By default, OfflineHeader takes up the top SafeArea, plus a bit more when offline.
/// Set
export function OfflineHeader({
  dontTakeUpSpace,
  offlineExtraMarginBottom,
}: {
  dontTakeUpSpace?: boolean;
  offlineExtraMarginBottom?: number;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const netState = useNetworkState();
  const isOffline = netState.status === "offline";

  const ins = useSafeAreaInsets();
  const top = Math.max(ins.top, 16);
  const alwaysHasAdding = !dontTakeUpSpace;
  const offlineMargin =
    (dontTakeUpSpace ? -top : 0) + (offlineExtraMarginBottom || 0);

  const style = {
    backgroundColor: isOffline ? color.warningLight : color.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: isOffline || alwaysHasAdding ? top : 0,
    marginHorizontal: -16,
    marginBottom: isOffline ? offlineMargin : 0,
  } as const;

  const isAndroid = Platform.OS === "android";

  const onPressHeader = async () => {
    setRefreshing(true);
    await resync("Home screen pull refresh");
    setRefreshing(false);
  };

  return (
    <View style={style}>
      {
        isOffline && isAndroid && (
          <Spacer h={16} />
        ) /* Some Androids have a camera excluded from the safe insets. */
      }
      <TouchableOpacity onPress={onPressHeader}>
        {refreshing && (
          <TextBody color={color.midnight}>
            <Spacer w={8} />
            Retrying...
          </TextBody>
        )}
        {isOffline && !refreshing && (
          <TextBody color={color.midnight}>
            <Octicons name="alert" size={14} />
            <Spacer w={8} />
            Offline
          </TextBody>
        )}
      </TouchableOpacity>
      {isOffline && <Spacer h={8} />}
    </View>
  );
}
