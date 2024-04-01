import React from "react";
import { Platform, View } from "react-native";

import { Badge } from "../shared/Badge";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import {
  TextBold,
  TextCenter,
  TextH3,
  TextLight,
  TextPara,
} from "../shared/text";

export function WithdrawInstructionsBottomSheet() {
  const BB = Platform.OS === "android" ? TextBold : Badge;

  return (
    <View style={{ ...ss.container.padH16, height: 472 }}>
      <TextCenter>
        <TextH3>Withdraw</TextH3>
      </TextCenter>
      <Spacer h={16} />
      <TextLight>Withdraw to another wallet</TextLight>
      <Spacer h={8} />
      <TextPara color={color.grayDark}>
        Tap Send, then paste in your wallet address. Remember that you're
        sending USDC on Base.
      </TextPara>
      <Spacer h={16} />
      <TextLight>Withdraw to Coinbase</TextLight>
      <Spacer h={8} />
      <TextPara color={color.grayDark}>
        Go to Coinbase, then tap <BB>Send & Receive</BB> ▶ <BB>Receive</BB>.
        Choose <BB>USDC</BB>. Finally, set Network to <BB>Base</BB>.
      </TextPara>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        Use Daimo to send to the address shown. Funds should appear on Coinbase
        in a few minutes.
      </TextPara>
    </View>
  );
}
