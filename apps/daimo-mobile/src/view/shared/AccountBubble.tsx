import { AddrLabel, EAccount, getAccountName } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useMemo } from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";

import { color } from "./style";

export function AccountBubble({
  eAcc,
  size,
  isPending,
  transparent,
}: {
  eAcc: EAccount;
  size: number;
  isPending?: boolean;
  transparent?: boolean;
}) {
  const col = isPending ? color.primaryBgLight : color.primary;

  const style: ViewStyle = useMemo(
    () => ({
      width: size - 1,
      height: size - 1,
      borderRadius: size / 2,
      backgroundColor: transparent ? "transparent" : color.white,
      borderWidth: 1,
      borderColor: col,
      alignItems: "center",
      justifyContent: "center",
    }),
    [size, col]
  );

  const textStyle: TextStyle = useMemo(
    () => ({
      fontSize: size / 2 + 1,
      lineHeight: size - 2.5,
      fontWeight: "bold",
      textAlign: "center",
      color: col,
    }),
    [size, col]
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
        case AddrLabel.Coinbase:
          return <Octicons name="plus" size={16} color={color.primary} />;
        default:
          return "?";
      }
    } else {
      const codePoint = name.codePointAt(0) || "?".charCodeAt(0);
      return String.fromCodePoint(codePoint).toUpperCase();
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
