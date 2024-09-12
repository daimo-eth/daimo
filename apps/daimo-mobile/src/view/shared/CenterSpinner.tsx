import { View, ActivityIndicator } from "react-native";

import { ss } from "../style/style";

export function CenterSpinner() {
  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}
