import { SlotType, assert, findAccountUnusedSlot } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useContext, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { TranslationFunctions } from "../../i18n/i18n-types";
import { useAccount } from "../../logic/accountManager";
import { useI18n } from "../../logic/i18n";
import { AddKeySlotButton } from "../screen/keyRotation/AddKeySlotButton";
import { Badge } from "../shared/Badge";
import { ButtonBig } from "../shared/Button";
import { OctName } from "../shared/InputBig";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";
import { TextBody, TextCenter, TextH3 } from "../shared/text";

export function CreateBackupSheet() {
  const [step, setStep] = useState<0 | 1>(0);
  const i18n = useI18n();

  return (
    <View>
      {step === 0 ? (
        <CreateBackupContent setStep={setStep} _i18n={i18n} />
      ) : (
        <OfflineBackupContent setStep={setStep} _i18n={i18n} />
      )}
      <Spacer h={36} />
    </View>
  );
}

function AddKeyButton({
  slotType,
  _i18n,
}: {
  slotType: SlotType;
  _i18n: TranslationFunctions;
}) {
  const account = useAccount();
  assert(account != null);
  const i18 = _i18n.createBackup.addKey;

  const slot = useMemo(() => findAccountUnusedSlot(account, slotType), []);

  const isPasskey = slotType === SlotType.PasskeyBackup;
  const isSecurityKey = slotType === SlotType.SecurityKeyBackup;
  assert(isPasskey || isSecurityKey, "Unknown slot type");
  const slotTypeStr = isPasskey ? i18.passkey() : i18.securityKey();

  return (
    <AddKeySlotButton
      buttonTitle={`${i18.button({ slotType: slotTypeStr })}`}
      account={account}
      slot={slot}
    />
  );
}

function CreateBackupContent({
  setStep,
  _i18n,
}: {
  setStep: (value: 0 | 1) => void;
  _i18n: TranslationFunctions;
}) {
  const i18n = _i18n.createBackup;
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{ paddingHorizontal: 24 }}
    >
      <TextCenter>
        <TextH3>{i18n.default.header()}</TextH3>
      </TextCenter>
      <Spacer h={16} />
      <View style={styles.separator} />
      <Spacer h={16} />
      <BackupOptionRow
        icon="key"
        title={i18n.default.passkeyTitle()}
        recommended
        _i18n={_i18n}
      />
      <Spacer h={16} />
      <BulletRow text={i18n.default.passkeyBullet1()} />
      <BulletRow text={i18n.default.passkeyBullet2()} />
      <Spacer h={24} />
      <AddKeyButton slotType={SlotType.PasskeyBackup} _i18n={_i18n} />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title={i18n.default.offlineInsteadButton()}
        onPress={() => setStep(1)}
      />
    </Animated.View>
  );
}

function BulletRow({ text }: { text: string }) {
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
  _i18n,
}: {
  setStep: (value: 0 | 1) => void;
  _i18n: TranslationFunctions;
}) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);
  const i18n = _i18n.createBackup.offline;

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
        title={i18n.header()}
        onBack={() => setStep(0)}
        hideOfflineHeader
      />
      <View style={styles.separator} />
      <Spacer h={20} />
      {Platform.OS !== "android" && (
        <>
          <BackupOptionRow
            icon="key"
            title={i18n.securityKeyTitle()}
            _i18n={_i18n}
          />
          <Spacer h={16} />
          <BulletRow text={i18n.securityKeyBullet1()} />
          <Spacer h={24} />
          <AddKeyButton slotType={SlotType.SecurityKeyBackup} _i18n={_i18n} />
          <Spacer h={20} />
          <View style={styles.separator} />
          <Spacer h={20} />
        </>
      )}
      <BackupOptionRow
        icon="comment"
        title={i18n.seedPhraseTitle()}
        _i18n={_i18n}
      />
      <Spacer h={16} />
      <BulletRow text={i18n.seedPhraseBullet1()} />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title={i18n.seedPhraseButton()}
        onPress={goToSeedPhrase}
      />
    </Animated.View>
  );
}

function BackupOptionRow({
  icon,
  title,
  recommended,
  _i18n,
}: {
  icon: OctName;
  title: string;
  recommended?: boolean;
  _i18n: TranslationFunctions;
}) {
  const { width } = useSafeAreaFrame();
  const isCompact = width < 400;
  const i18 = _i18n.createBackup;

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

const styles = StyleSheet.create({
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
