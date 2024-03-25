import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import Spacer from "./Spacer";
import { TextCenter, TextLight } from "./text";

export function ButtonWithStatus({
  button,
  status,
}: {
  button: ReactNode;
  status: ReactNode;
}) {
  return (
    <View style={style.buttonWithStatus}>
      {button}
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{status}</TextLight>
      </TextCenter>
    </View>
  );
}

const style = StyleSheet.create({
  buttonWithStatus: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "stretch",
  },
  statusRow: {
    alignSelf: "stretch",
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
  },
});
