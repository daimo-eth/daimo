import { assert } from "@daimo/common";
import { ChainConfig, daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useRef, useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import "react-native-url-polyfill/auto";

import { WithdrawScreen } from "./WithdrawScreen";
import { env } from "../../../logic/env";
import { Account } from "../../../model/account";
import { ButtonMed } from "../../shared/Button";
import { CheckLabel } from "../../shared/Check";
import { InfoBubble } from "../../shared/InfoBubble";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import { SegmentSlider } from "../../shared/SegmentSlider";
import Spacer from "../../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import { TextBold, TextLight, TextPara } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Tab = "DEPOSIT" | "WITHDRAW";
export default function DepositScreen() {
  const [tab, setTab] = useState<Tab>("DEPOSIT");
  const tabs = useRef(["DEPOSIT", "WITHDRAW"] as Tab[]).current;

  const DepositInner = useWithAccount(DepositScreenInner);
  const WithdrawInner = useWithAccount(WithdrawScreen);

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Deposit" onExit={useExitToHome()} />
      <Spacer h={8} />
      <SegmentSlider {...{ tabs, tab, setTab }} />
      <Spacer h={24} />
      {tab === "DEPOSIT" && <DepositInner />}
      {tab === "WITHDRAW" && <WithdrawInner />}
    </View>
  );
}

function DepositScreenInner({ account }: { account: Account }) {
  const { chainConfig } = env(daimoChainFromId(account.homeChainId));
  const testnet = chainConfig.chainL2.testnet;

  return (
    <View>
      {!testnet && (
        <>
          <OnrampsSection account={account} />
          <Spacer h={32} />
        </>
      )}
      <SendToAddressSection {...{ account, chainConfig }} />
    </View>
  );
}

function OnrampsSection({ account }: { account: Account }) {
  const [started, setStarted] = useState(false);

  const openRecommendedExchange = (url: string) => {
    Linking.openURL(url);
    setStarted(true);
  };

  return (
    <View>
      <HeaderRow title="Recommended exchanges" />

      {account.recommendedExchanges.map((rec, idx) => (
        <View key={idx}>
          <ButtonMed
            type={idx > 0 ? "subtle" : "primary"}
            title={rec.cta}
            onPress={() => openRecommendedExchange(rec.url)}
          />
          {idx < account.recommendedExchanges.length - 1 && <Spacer h={16} />}
        </View>
      ))}
      {started && <Spacer h={16} />}
      {started && (
        <InfoBubble
          icon="check"
          title="Deposit started"
          subtitle="Complete in browser, then funds should arrive in a few minutes."
        />
      )}
    </View>
  );
}

function SendToAddressSection({
  account,
  chainConfig,
}: {
  account: Account;
  chainConfig: ChainConfig;
}) {
  const { tokenSymbol, chainL2 } = chainConfig;

  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  assert(tokenSymbol === "USDC", "Unsupported coin: " + tokenSymbol);

  return (
    <View>
      <HeaderRow title="Deposit to address" />
      <View style={ss.container.padH16}>
        <TextPara>
          Send {tokenSymbol} to your address below. Confirm that you're sending:
        </TextPara>
        <Spacer h={12} />
        <CheckLabel value={check1} setValue={setCheck1}>
          <TextBold>{tokenSymbol}</TextBold>, not USDbC or other assets
        </CheckLabel>
        <Spacer h={16} />
        <CheckLabel value={check2} setValue={setCheck2}>
          On <TextBold>{chainL2.name}</TextBold>, not any other chain
        </CheckLabel>
        <Spacer h={16} />
        <AddressCopier addr={account.address} disabled={!check1 || !check2} />
      </View>
    </View>
  );
}

function AddressCopier({
  addr,
  disabled,
}: {
  addr: string;
  disabled?: boolean;
}) {
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(addr);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [addr]);

  const col = disabled ? color.gray3 : color.midnight;

  return (
    <View style={styles.address}>
      <TouchableHighlight
        style={styles.addressButton}
        onPress={disabled ? undefined : copy}
        {...touchHighlightUnderlay.subtle}
      >
        <View style={styles.addressView}>
          <Text style={[styles.addressMono, { color: col }]} numberOfLines={1}>
            {addr}
          </Text>
          <Octicons name="copy" size={16} color={col} />
        </View>
      </TouchableHighlight>
      <TextLight>{justCopied ? "Copied" : " "}</TextLight>
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

const styles = StyleSheet.create({
  address: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  addressButton: {
    borderRadius: 8,
    backgroundColor: color.ivoryDark,
    padding: 16,
  },
  addressView: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  addressMono: {
    ...ss.text.mono,
    flexShrink: 1,
  },
  callout: {
    backgroundColor: color.ivoryDark,
    padding: 16,
    borderRadius: 24,
  },
});
