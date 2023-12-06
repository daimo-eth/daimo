import { AddrLabel, EAccount, getAccountName } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useMemo } from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";

import { color } from "./style";

export function AccountBubble({
  eAcc,
  size,
  fontSize,
  isPending,
  transparent,
}: {
  eAcc: EAccount;
  size: number;
  fontSize?: number;
  isPending?: boolean;
  transparent?: boolean;
}) {
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
    <Bubble
      inside={letter}
      size={size}
      fontSize={fontSize}
      isPending={isPending}
      transparent={transparent}
    />
  );
}

export function Bubble({
  inside,
  size,
  fontSize,
  isPending,
  transparent,
}: {
  inside: string | React.JSX.Element;
  size: number;
  fontSize?: number;
  isPending?: boolean;
  transparent?: boolean;
}) {
  const col = isPending ? color.primaryBgLight : color.primary;

  if (fontSize == null) fontSize = size / 2 + 1;

  const style: ViewStyle = useMemo(
    () => ({
      width: size - 1,
      height: size - 1,
      borderRadius: 99,
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
      fontSize,
      lineHeight: size - 3,
      fontWeight: "bold",
      textAlign: "center",
      color: col,
    }),
    [size, col]
  );

  return (
    <View style={style}>
      <Text style={textStyle} numberOfLines={1}>
        {inside}
      </Text>
    </View>
  );
}
