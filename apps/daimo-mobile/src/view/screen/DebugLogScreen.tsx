import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSendDebugLog } from "../../common/useSendDebugLog";
import { ButtonMed } from "../shared/Button";
import ScrollPellet from "../shared/ScrollPellet";
import Spacer from "../shared/Spacer";
import { TextH3, TextLight } from "../shared/text";

export function DebugLogScreen() {
  const { bottom } = useSafeAreaInsets();

  const [sendDL] = useSendDebugLog();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentContainer,
          {
            paddingBottom: 32 + bottom,
          },
        ]}
      >
        <ScrollPellet />
        <Spacer h={16} />
        <TextH3>Did something go wrong?</TextH3>
        <Spacer h={12} />
        <TextLight>Help us realize what's going wrong.</TextLight>
        <Spacer h={32} />
        <ButtonMed type="subtle" title="Send debug log" onPress={sendDL} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  contentContainer: {
    backgroundColor: "white",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
