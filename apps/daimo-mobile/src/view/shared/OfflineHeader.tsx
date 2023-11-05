import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Spacer from "./Spacer";
import { color } from "./style";
import { TextBody } from "./text";
import { useNetworkState } from "../../sync/networkState";

export function OfflineHeader() {
  const netState = useNetworkState();
  const isOffline = netState === "offline";

  const ins = useSafeAreaInsets();
  const top = Math.max(ins.top, 16);
  const style = {
    backgroundColor: isOffline ? color.warningLight : color.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: top,
    marginHorizontal: -16,
  } as const;

  return (
    <View style={style}>
      {isOffline && (
        <TextBody color={color.midnight}>
          <Octicons name="alert" size={14} />
          <Spacer w={8} />
          Offline
        </TextBody>
      )}
      {isOffline && <Spacer h={8} />}
    </View>
  );
}
