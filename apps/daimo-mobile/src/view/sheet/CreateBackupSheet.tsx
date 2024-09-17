import { SlotType, assert, findAccountUnusedSlot } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useContext, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { AddKeySlotButton } from "../screen/keyRotation/AddKeySlotButton";
import { Badge } from "../shared/Badge";
import { ButtonBig } from "../shared/Button";
import { OctName } from "../shared/InputBig";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { TextBody, TextCenter, TextH3 } from "../shared/text";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

const i18 = i18n.createBackup;

export function CreateBackupSheet() {
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <View>
      {step === 0 ? (
        <CreateBackupContent setStep={setStep} />
      ) : (
        <OfflineBackupContent setStep={setStep} />
      )}
      <Spacer h={36} />
    </View>
  );
}

function AddKeyButton({ slotType }: { slotType: SlotType }) {
  const account = useAccount();
  assert(account != null);

  const slot = useMemo(() => findAccountUnusedSlot(account, slotType), []);

  const isPasskey = slotType === SlotType.PasskeyBackup;
  const isSecurityKey = slotType === SlotType.SecurityKeyBackup;
  assert(isPasskey || isSecurityKey, "Unknown slot type");
  const slotTypeStr = isPasskey
    ? i18.addKey.passkey()
    : i18.addKey.securityKey();

  return (
    <AddKeySlotButton
      buttonTitle={`${i18.addKey.button(slotTypeStr)}`}
      account={account}
      slot={slot}
    />
  );
}

function CreateBackupContent({ setStep }: { setStep: (value: 0 | 1) => void }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <TextCenter>
        <TextH3>{i18.default.header()}</TextH3>
      </TextCenter>
      <Spacer h={16} />
      <View style={styles.separator} />
      <Spacer h={16} />
      <BackupOptionRow
        icon="key"
        title={i18.default.passkeyTitle()}
        recommended
      />
      <Spacer h={16} />
      <BulletRow text={i18.default.passkeyBullet1()} />
      <BulletRow text={i18.default.passkeyBullet2()} />
      <Spacer h={24} />
      <AddKeyButton slotType={SlotType.PasskeyBackup} />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title={i18.default.offlineInsteadButton()}
        onPress={() => setStep(1)}
      />
    </Animated.View>
  );
}

function BulletRow({ text }: { text: string }) {
  const { color } = useTheme();
  return (
    <View style={{ flexDirection: "row" }}>
      <TextBody color={color.grayMid}>•</TextBody>
      <Spacer w={8} />
      <TextBody color={color.grayMid} style={{ flexShrink: 1 }}>
        {text}
      </TextBody>
    </View>
  );
}

function OfflineBackupContent({
  setStep,
}: {
  setStep: (value: 0 | 1) => void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const goToSeedPhrase = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
    nav.navigate("SettingsTab", { screen: "SeedPhrase" });
  }, [nav, dispatcher]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <ScreenHeader
        title={i18.offline.header()}
        onBack={() => setStep(0)}
        hideOfflineHeader
      />
      <View style={styles.separator} />
      <Spacer h={20} />
      {Platform.OS !== "android" && (
        <>
          <BackupOptionRow icon="key" title={i18.offline.securityKeyTitle()} />
          <Spacer h={16} />
          <BulletRow text={i18.offline.securityKeyBullet1()} />
          <Spacer h={24} />
          <AddKeyButton slotType={SlotType.SecurityKeyBackup} />
          <Spacer h={20} />
          <View style={styles.separator} />
          <Spacer h={20} />
        </>
      )}
      <BackupOptionRow icon="comment" title={i18.offline.seedPhraseTitle()} />
      <Spacer h={16} />
      <BulletRow text={i18.offline.seedPhraseBullet1()} />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title={i18.offline.seedPhraseButton()}
        onPress={goToSeedPhrase}
      />
    </Animated.View>
  );
}

function BackupOptionRow({
  icon,
  title,
  recommended,
}: {
  icon: OctName;
  title: string;
  recommended?: boolean;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const { width } = useSafeAreaFrame();
  const isCompact = width < 400;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={styles.keyCircle}>
        <Octicons name={icon} size={20} color={color.primary} />
      </View>
      <Spacer w={12} />
      <TextBody>{title}</TextBody>
      {recommended && (
        <>
          <Spacer w={12} />
          <Badge color={color.primary}>
            {isCompact ? i18.recommended.compact() : i18.recommended.default()}
          </Badge>
        </>
      )}
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    keyCircle: {
      backgroundColor: color.grayLight,
      height: 40,
      width: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    separator: {
      borderBottomWidth: 0.5,
      borderBottomColor: color.grayLight,
    },
  });
