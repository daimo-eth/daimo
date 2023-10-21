import { EAccount, getAccountName, AddrLabel } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useMemo } from "react";
import { ViewStyle, TextStyle, View, Text } from "react-native";

import { color } from "./style";

export function AccountBubble({
  eAcc,
  size,
}: {
  eAcc: EAccount;
  size: number;
}) {
  const style: ViewStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color.white,
      borderWidth: 1,
      borderColor: color.primary,
      alignItems: "center",
      justifyContent: "center",
    }),
    [size]
  );

  const textStyle: TextStyle = useMemo(
    () => ({
      fontSize: size / 2,
      lineHeight: size / 2 + 4,
      fontWeight: "bold",
      textAlign: "center",
      color: color.primary,
    }),
    [size]
  );

  const name = getAccountName(eAcc);
  const letter = (function () {
    if (name.startsWith("0x")) {
      return "0x";
    } else if (eAcc.label != null) {
      switch (eAcc.label) {
        case AddrLabel.Faucet:
          return <Octicons name="download" size={16} color={color.primary} />;
        case AddrLabel.PaymentLink:
          return <Octicons name="link" size={16} color={color.primary} />;
        default:
          return "?";
      }
    } else {
      return name[0].toUpperCase();
    }
  })();

  return (
    <View style={style}>
      <Text style={textStyle} numberOfLines={1}>
        {letter}
      </Text>
    </View>
  );
}
