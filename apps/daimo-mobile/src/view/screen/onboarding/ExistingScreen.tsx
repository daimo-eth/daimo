import { SlotType } from "@daimo/common";
import { useCallback } from "react";
import { View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useExitBack, useOnboardingNav } from "../../../common/nav";
import { env } from "../../../env";
import { i18n } from "../../../i18n";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import { createAddDeviceString } from "../../../logic/key";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import {
  TextBody,
  TextBodyMedium,
  TextCenter,
  TextLight,
} from "../../shared/text";
import { useTheme } from "../../style/theme";
import { QRCodeBox } from "../QRScreen";

const i18 = i18n.existing;

export function ExistingScreen() {
  const { color, ss } = useTheme();

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
        <OnboardingHeader title={i18.screenHeader()} onPrev={onPrev} />
        <View style={ss.container.padH24}>
          <Spacer h={24} />
          <TextCenter>
            <TextBody>{i18.generatingKeys()}</TextBody>
          </TextCenter>
        </View>
      </View>
    );
  }

  return (
    <View>
      <OnboardingHeader title={i18.screenHeader()} onPrev={onPrev} />
      <View style={ss.container.padH24}>
        <Spacer h={16} />
        <QRCodeBox value={createAddDeviceString(pubKeyHex, slotType)} />
        <Spacer h={16} />
        <TextCenter>
          <TextBodyMedium color={color.grayMid}>{i18.scanQR()}</TextBodyMedium>
        </TextCenter>
        <Spacer h={24} />
        <TextCenter>
          <TextLight>or</TextLight>
        </TextCenter>
        <Spacer h={24} />
        <ButtonBig
          type="primary"
          title={i18.useBackup()}
          onPress={onUseBackup}
        />
      </View>
    </View>
  );
}
