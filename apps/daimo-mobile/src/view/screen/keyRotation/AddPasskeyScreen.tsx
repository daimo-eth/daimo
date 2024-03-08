import { SlotType, assert, findUnusedSlot } from "@daimo/common";
import { useMemo } from "react";
import { Platform, View } from "react-native";

import { AddKeySlotButton } from "./AddKeySlotButton";
import { useAccount } from "../../../model/account";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { useExitBack, useExitToHome } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextPara } from "../../shared/text";

export function AddPasskeyScreen() {
  const [account] = useAccount();
  assert(account != null);

  const passkeySlot = useMemo(
    () =>
      findUnusedSlot(
        account.accountKeys.map((k) => k.slot),
        SlotType.PasskeyBackup
      ),
    []
  );

  const cloudName =
    Platform.OS === "ios" ? "iCloud Keychain" : "Google Password Manager";

  const goBack = useExitBack();
  const goHome = useExitToHome();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Passkey Backup" onBack={goBack || goHome} />
      <Spacer h={32} />
      <View style={ss.container.padH16}>
        <TextPara>
          Back up your account by saving a secure passkey in {cloudName}.
        </TextPara>
        <Spacer h={8} />
        <TextPara>
          This way, your funds will be safe even if you lose your device.
        </TextPara>
      </View>
      <Spacer h={32} />
      <AddKeySlotButton
        buttonTitle="Create Passkey Backup"
        account={account}
        slot={passkeySlot}
      />
    </View>
  );
}
