import { findAccountUnusedSlot, getSlotLabel } from "@daimo/common";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useState } from "react";
import { View } from "react-native";
import { Hex } from "viem";

import { AddKeySlotButton } from "./AddKeySlotButton";
import { useNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { parseAddDeviceString } from "../../../logic/key";
import { Account } from "../../../storage/account";
import { Scanner } from "../../shared/Scanner";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextH2, TextPara } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { useTheme } from "../../style/theme";

const i18 = i18n.addDevice;

export function AddDeviceScreen() {
  const Inner = useWithAccount(AddDeviceScreenInner);
  return <Inner />;
}

type KeyAndSlot = { key: Hex; slot: number };

function AddDeviceScreenInner({ account }: { account: Account }) {
  const { ss } = useTheme();

  const [newKeyAndSlot, setNewKeyAndSlot] = useState<KeyAndSlot>();
  const [barCodeStatus, setBarCodeStatus] = useState<
    "idle" | "error" | "scanned"
  >("idle");

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (barCodeStatus !== "idle") return;

    try {
      const [parsedKey, parsedSlotType] = parseAddDeviceString(data);
      setBarCodeStatus("scanned");

      console.log(`[SCAN] got key ${parsedKey} ${parsedSlotType}`);
      const nextSlot = findAccountUnusedSlot(account, parsedSlotType);
      setNewKeyAndSlot({ key: parsedKey, slot: nextSlot });
    } catch (e) {
      console.error(`[SCAN] error parsing QR code: ${e}`);
      setBarCodeStatus("error");
    }
  };

  const nav = useNav();
  const goBack = () => nav.goBack();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={i18.screenHeader()} onBack={goBack} />
      <Spacer h={32} />
      <View style={ss.container.padH16}>
        <TextPara>{i18.headerDescription()}</TextPara>
      </View>
      <Spacer h={32} />
      {barCodeStatus === "idle" && (
        <Scanner handleBarCodeScanned={handleBarCodeScanned} />
      )}
      {barCodeStatus === "error" && (
        <TextCenter>
          <TextH2>{i18.scanQR.error()}</TextH2>
        </TextCenter>
      )}
      {barCodeStatus === "scanned" && newKeyAndSlot && (
        <>
          <TextCenter>
            <TextH2>
              {i18.scanQR.scanned(getSlotLabel(newKeyAndSlot.slot))}
            </TextH2>
          </TextCenter>
          <Spacer h={32} />
          <AddKeySlotButton
            account={account}
            slot={newKeyAndSlot.slot}
            knownPubkey={newKeyAndSlot.key}
            buttonTitle={i18.scanQR.add(getSlotLabel(newKeyAndSlot.slot))}
          />
        </>
      )}
    </View>
  );
}
