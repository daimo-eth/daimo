import { assert, getAddressContraction } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useContext, useState } from "react";
import { StyleSheet, TouchableHighlight, View } from "react-native";
import { Address } from "viem";

import { DispatcherContext } from "../../action/dispatch";
import { env } from "../../env";
import { i18n } from "../../i18n";
import { Account } from "../../storage/account";
import { CheckLabel } from "../shared/Check";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { DaimoText, TextBold, TextLight, TextPara } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

// Explains how to deposit money directly to your Daimo address
export function DepositAddressBottomSheet() {
  const Inner = useWithAccount(DepositAddressBottomSheetInner);
  return <Inner />;
}

const i18 = i18n.depositAddressBottom;

function DepositAddressBottomSheetInner({ account }: { account: Account }) {
  const dispatcher = useContext(DispatcherContext);

  const { tokenSymbol, chainL2 } = env(
    daimoChainFromId(account.homeChainId)
  ).chainConfig;

  const [check, setCheck] = useState(false);

  assert(tokenSymbol === "USDC", "Unsupported coin: " + tokenSymbol);

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader
        title={i18n.sheets.deposit()}
        onExit={() => {
          dispatcher.dispatch({ name: "hideBottomSheet" });
        }}
        hideOfflineHeader
      />
      <Spacer h={16} />
      <TextPara color={color.grayDark}>{i18.description(tokenSymbol)}</TextPara>
      <Spacer h={12} />
      <CheckLabel value={check} setValue={setCheck}>
        {i18.checkChain.on()} <TextBold>{chainL2.name}</TextBold>
        {i18.checkChain.notOther()}
      </CheckLabel>
      <Spacer h={16} />
      <AddressCopier addr={account.address} disabled={!check} />
      <Spacer h={64} />
    </View>
  );
}

function AddressCopier({
  addr,
  disabled,
}: {
  addr: Address;
  disabled?: boolean;
}) {
  const [justCopied, setJustCopied] = useState(false);
  const copy = useCallback(async () => {
    await Clipboard.setStringAsync(addr);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1000);
  }, [addr]);

  const col = disabled ? color.gray3 : color.midnight;

  const addrContracted = getAddressContraction(addr, 12);

  return (
    <View style={styles.address}>
      <TouchableHighlight
        style={styles.addressButton}
        onPress={disabled ? undefined : copy}
        {...touchHighlightUnderlay.subtle}
      >
        <View style={styles.addressView}>
          <DaimoText
            style={[styles.addressMono, { color: col }]}
            numberOfLines={1}
          >
            {addrContracted}
          </DaimoText>
          <Octicons name="copy" size={16} color={col} />
        </View>
      </TouchableHighlight>
      <TextLight>{justCopied ? i18.copied() : " "}</TextLight>
    </View>
  );
}

const styles = StyleSheet.create({
  address: {
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
    paddingHorizontal: 16,
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
});
