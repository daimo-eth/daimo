import { assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import React from "react";
import { Platform, View } from "react-native";

import { env } from "../../../logic/env";
import { Account } from "../../../model/account";
import { Badge } from "../../shared/Badge";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextBold, TextLight, TextPara } from "../../shared/text";

export function WithdrawScreen({ account }: { account: Account }) {
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  assert(chainConfig.tokenSymbol === "USDC");
  assert(chainConfig.chainL2.name.startsWith("Base"));

  const BB = Platform.OS === "android" ? TextBold : Badge;

  return (
    <View>
      <HeaderRow title="Withdraw via Coinbase" />
      <View style={ss.container.padH16}>
        <TextPara>
          Go to Coinbase, then tap <BB>Send & Receive</BB> ▶ <BB>Receive</BB>.
          Choose <BB>USDC</BB>. Finally, set Network to <BB>Base</BB>.
        </TextPara>
        <Spacer h={16} />
        <TextPara>
          Use Daimo to send to the address shown. Funds should appear on
          Coinbase in a few minutes.
        </TextPara>
      </View>
      <Spacer h={32} />
      <HeaderRow title="Withdraw to another exchange" />
      <View style={ss.container.padH16}>
        <TextPara>
          More instructions coming soon. The process is similar at most
          exchanges. Just make sure your exchange can receive <BB>USDC</BB> on{" "}
          <BB>Base</BB>.
        </TextPara>
      </View>
    </View>
  );
}

function HeaderRow({ title }: { title: string }) {
  return (
    <>
      <Spacer h={16} />
      <TextLight>{title}</TextLight>
      <Spacer h={16} />
    </>
  );
}
