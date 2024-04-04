import React, { useContext } from "react";
import { Platform, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { Badge } from "../shared/Badge";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBold, TextLight, TextPara } from "../shared/text";

// Explains how to withdraw money from your Daimo account, using another wallet
// or exchange.
export function WithdrawInstructionsBottomSheet() {
  const dispatcher = useContext(DispatcherContext);
  const BB = Platform.OS === "android" ? TextBold : Badge;

  console.log("WithdrawInstructionsBottomSheet");

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title="Withdraw"
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TextLight>Withdraw to another wallet</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        Tap Send, then paste in your wallet address. Remember that you're
        sending USDC on Base.
      </TextPara>
      <Spacer h={32} />
      <TextLight>Withdraw to Coinbase</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        Go to Coinbase, then tap <BB>Send & Receive</BB> ▶ <BB>Receive</BB>.
        Choose <BB>USDC</BB>. Finally, set Network to <BB>Base</BB>.
      </TextPara>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        Use Daimo to send to the address shown. Funds should appear on Coinbase
        in a few minutes.
      </TextPara>
      <Spacer h={64} />
    </View>
  );
}
