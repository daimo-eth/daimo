import { View, ActivityIndicator } from "react-native";

import { useTheme } from "../style/theme";

export function CenterSpinner() {
  const { ss } = useTheme();
  return (
    <View style={ss.container.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}
