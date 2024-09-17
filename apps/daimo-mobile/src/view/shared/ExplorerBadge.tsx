import { getAddressContraction } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback } from "react";
import { Linking, View } from "react-native";
import { Address } from "viem";

import { BadgeButton } from "./Button";
import { TextBtnCaps } from "./text";
import { env } from "../../env";
import { useTheme } from "../style/theme";

export function ExplorerBadge({
  daimoChain,
  address,
}: {
  daimoChain: DaimoChain;
  address: Address;
}) {
  const { color } = useTheme();
  const openExplorer = useCallback(() => {
    const { chainConfig } = env(daimoChain);
    const explorer = chainConfig.chainL2.blockExplorers!.default;
    const url = `${explorer.url}/address/${address}`;
    Linking.openURL(url);
  }, [address, daimoChain]);

  return (
    <BadgeButton onPress={openExplorer}>
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Octicons name="globe" size={16} color={color.midnight} />
        <TextBtnCaps color={color.grayDark}>
          {getAddressContraction(address, 2)}
        </TextBtnCaps>
      </View>
    </BadgeButton>
  );
}
