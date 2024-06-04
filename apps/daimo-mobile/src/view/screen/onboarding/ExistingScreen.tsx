import { SlotType } from "@daimo/common";
import { useCallback } from "react";
import { View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { createAddDeviceString } from "../../../logic/key";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import {
  TextBody,
  TextBodyMedium,
  TextCenter,
  TextLight,
} from "../../shared/text";
import { QRCodeBox } from "../QRScreen";

export function ExistingScreen() {
  // On-chain signing key slot identifies key type (phone, computer, etc)
  const daimoChain = useDaimoChain();
  const slotType =
    env(daimoChain).deviceType === "phone" ? SlotType.Phone : SlotType.Computer;

  // Wait for enclave key to be loaded. Create one if necessary
  const { account, keyInfo } = useAccountAndKeyInfo();
  const pubKeyHex = keyInfo?.pubKeyHex;

  const onPrev = useExitBack();

  const nav = useOnboardingNav();
  const onUseBackup = useCallback(
    () => nav.navigate("ExistingChooseAccount"),
    [nav]
  );

  if (account != null) return null; // Will nav to home screen shortly.

  if (pubKeyHex == null) {
    return (
      <View>
        <OnboardingHeader title="Existing Account" onPrev={onPrev} />
        <View style={ss.container.padH24}>
          <Spacer h={24} />
          <TextCenter>
            <TextBody>Generating keys...</TextBody>
          </TextCenter>
        </View>
      </View>
    );
  }

  return (
    <View>
      <OnboardingHeader title="Existing Account" onPrev={onPrev} />
      <View style={ss.container.padH24}>
        <Spacer h={16} />
        <QRCodeBox value={createAddDeviceString(pubKeyHex, slotType)} />
        <Spacer h={16} />
        <TextCenter>
          <TextBodyMedium color={color.grayMid}>
            Scan this QR code from another device to add this phone to an
            existing Daimo account.
          </TextBodyMedium>
        </TextCenter>
        <Spacer h={24} />
        <TextCenter>
          <TextLight>or</TextLight>
        </TextCenter>
        <Spacer h={24} />
        <ButtonBig type="primary" title="Use Backup" onPress={onUseBackup} />
      </View>
    </View>
  );
}
