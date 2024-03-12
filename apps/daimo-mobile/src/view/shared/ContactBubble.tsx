import { AddrLabel } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { Image, ImageStyle } from "expo-image";
import { useMemo } from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";

import { color } from "./style";
import {
  DaimoContact,
  getContactName,
  getContactProfilePicture,
} from "../../logic/daimoContacts";

export function ContactBubble({
  contact,
  size,
  isPending,
  transparent,
}: {
  contact: DaimoContact;
  size: number;
  isPending?: boolean;
  transparent?: boolean;
}) {
  const name = getContactName(contact);
  const image = getContactProfilePicture(contact);

  const fontSize = (function () {
    switch (size) {
      case 64:
        return 24;
      case 50:
        return 20;
      case 36:
        return 14;
      default:
        throw new Error(`Invalid size: ${size}`);
    }
  })();

  const letter = (function () {
    if (contact.type === "email") {
      return <Octicons name="mail" size={fontSize} color={color.primary} />;
    } else if (contact.type === "phoneNumber") {
      return <Octicons name="person" size={fontSize} color={color.primary} />;
    } else if (name.startsWith("0x")) {
      return "0x";
    } else if (contact.label != null) {
      switch (contact.label) {
        case AddrLabel.Faucet:
          return (
            <Octicons name="download" size={fontSize} color={color.primary} />
          );
        case AddrLabel.PaymentLink:
          return <Octicons name="link" size={fontSize} color={color.primary} />;
        case AddrLabel.Coinbase:
          return <Octicons name="plus" size={fontSize} color={color.primary} />;
        default:
          return "?";
      }
    } else {
      const codePoint = name.codePointAt(0) || "?".charCodeAt(0);
      return String.fromCodePoint(codePoint).toUpperCase();
    }
  })();

  return (
    <Bubble {...{ size, image, isPending, transparent, fontSize }}>
      {letter}
    </Bubble>
  );
}

export function Bubble({
  size,
  isPending,
  transparent,
  fontSize,
  image,
  children,
}: {
  size: number;
  isPending?: boolean;
  transparent?: boolean;
  fontSize: number;
  image?: string;
  children: React.ReactNode;
  logPrefix?: string;
}) {
  const col = isPending ? color.primaryBgLight : color.primary;

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

  const imageStyle: ImageStyle = useMemo(
    () => ({
      // Match size of bordered default bubble
      height: size - 1,
      width: size - 1,
      borderRadius: 99,
    }),
    [size]
  );

  return (
    <View style={{ width: size, height: size }}>
      {image ? (
        <Image source={image} style={imageStyle} />
      ) : (
        <View style={style}>
          <Text style={textStyle} numberOfLines={1} allowFontScaling={false}>
            {children}
          </Text>
        </View>
      )}
    </View>
  );
}
