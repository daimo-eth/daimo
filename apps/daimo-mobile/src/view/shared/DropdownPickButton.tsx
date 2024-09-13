import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";

import { useTheme } from "../style/theme";

// Dropdown picker button for dropdown
export function DropdownPickButton({
  size,
  iconSize,
}: {
  size?: number;
  iconSize?: number;
}) {
  const { color } = useTheme();
  return (
    <View
      style={{
        width: size ?? 24,
        height: size ?? 24,
        borderRadius: 24,
        backgroundColor: color.ivoryDark,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Octicons
        name="chevron-down"
        size={iconSize ?? 18}
        color={color.grayMid}
      />
    </View>
  );
}
