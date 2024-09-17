import React, { useContext } from "react";
import { Platform, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { i18n } from "../../i18n";
import { Badge } from "../shared/Badge";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { TextBold, TextLight, TextPara } from "../shared/text";
import { useTheme } from "../style/theme";

const i18 = i18n.withdrawInstructionsBottom;

// Explains how to withdraw money from your Daimo account, using another wallet
// or exchange.
export function WithdrawInstructionsBottomSheet() {
  const { color, ss } = useTheme();
  const dispatcher = useContext(DispatcherContext);
  const BB = Platform.OS === "android" ? TextBold : Badge;

  console.log("WithdrawInstructionsBottomSheet");

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={i18n.sheets.withdraw()}
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TextLight>{i18.wallet.title()}</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>{i18.wallet.description()}</TextPara>
      <Spacer h={32} />
      <TextLight>{i18.coinbase.title()}</TextLight>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>
        {i18.coinbase.description()}
        <BB>{i18.coinbase.steps.sendReceive()}</BB> ▶{" "}
        <BB>{i18.coinbase.steps.receive()}</BB>. {i18.coinbase.steps.choose()}
        <BB>USDC</BB>. {i18.coinbase.steps.setNetwork()}
        <BB>Base</BB>.
      </TextPara>
      <Spacer h={16} />
      <TextPara color={color.grayDark}>{i18.coinbase.sendToAddress()}</TextPara>
      <Spacer h={64} />
    </View>
  );
}
