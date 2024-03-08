import { SlotType, assert, findUnusedSlot } from "@daimo/common";
import { useMemo } from "react";
import { Platform, View } from "react-native";

import { AddKeySlotButton } from "./AddKeySlotButton";
import { useExitBack, useExitToHome } from "../../../common/nav";
import { useAccount } from "../../../logic/accountManager";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
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
          Back up your account by saving a secure passkey in your password
          manager, for example {cloudName} or 1Password.
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
