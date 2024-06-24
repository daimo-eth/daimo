import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";

import { color } from "./style";

// Dropdown picker button for dropdown
export function DropdownPickButton({
  size,
  iconSize,
}: {
  size?: number;
  iconSize?: number;
}) {
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
