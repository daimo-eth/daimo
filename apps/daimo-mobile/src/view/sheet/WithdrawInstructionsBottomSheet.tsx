import React, { useContext } from "react";
import { Platform, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useI18n } from "../../logic/i18n";
import { Badge } from "../shared/Badge";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss } from "../shared/style";
import { TextBold, TextLight, TextPara } from "../shared/text";

// Explains how to withdraw money from your Daimo account, using another wallet
// or exchange.
export function WithdrawInstructionsBottomSheet() {
  const dispatcher = useContext(DispatcherContext);
  const i18n = useI18n().withdrawInstructionsBottom;
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
      <TextLight>{i18n.wallet.title()}</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>{i18n.wallet.description()}</TextPara>
      <Spacer h={32} />
      <TextLight>{i18n.coinbase.title()}</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        {i18n.coinbase.description()}
        <BB>{i18n.coinbase.steps.sendReceive()}</BB> ▶{" "}
        <BB>{i18n.coinbase.steps.receive()}</BB>. {i18n.coinbase.steps.choose()}
        <BB>USDC</BB>. {i18n.coinbase.steps.setNetwork()}
        <BB>Base</BB>.
      </TextPara>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        {i18n.coinbase.sendToAddress()}
      </TextPara>
      <Spacer h={64} />
    </View>
  );
}
