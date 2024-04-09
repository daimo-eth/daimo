import { findAccountUnusedSlot, getSlotLabel } from "@daimo/common";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useState } from "react";
import { View } from "react-native";
import { Hex } from "viem";

import { AddKeySlotButton } from "./AddKeySlotButton";
import { useNav } from "../../../common/nav";
import { parseAddDeviceString } from "../../../logic/key";
import { Account } from "../../../model/account";
import { Scanner } from "../../shared/Scanner";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextCenter, TextH2, TextPara } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

export function AddDeviceScreen() {
  const Inner = useWithAccount(AddDeviceScreenInner);
  return <Inner />;
}

type KeyAndSlot = { key: Hex; slot: number };

function AddDeviceScreenInner({ account }: { account: Account }) {
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
      <ScreenHeader title="Add Device" onBack={goBack} />
      <Spacer h={32} />
      <View style={ss.container.padH16}>
        <TextPara>
          Link a new device to your account by scanning its QR code during
          setup.
        </TextPara>
      </View>
      <Spacer h={32} />
      {barCodeStatus === "idle" && (
        <Scanner handleBarCodeScanned={handleBarCodeScanned} />
      )}
      {barCodeStatus === "error" && (
        <TextCenter>
          <TextH2>Error Parsing QR Code</TextH2>
        </TextCenter>
      )}
      {barCodeStatus === "scanned" && newKeyAndSlot && (
        <>
          <TextCenter>
            <TextH2>Scanned {getSlotLabel(newKeyAndSlot.slot)}</TextH2>
          </TextCenter>
          <Spacer h={32} />
          <AddKeySlotButton
            account={account}
            slot={newKeyAndSlot.slot}
            knownPubkey={newKeyAndSlot.key}
            buttonTitle={`Add ${getSlotLabel(newKeyAndSlot.slot)}`}
          />
        </>
      )}
    </View>
  );
}
