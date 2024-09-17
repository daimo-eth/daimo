import Octicons from "@expo/vector-icons/Octicons";
import { TouchableHighlight } from "@gorhom/bottom-sheet";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { i18n } from "../../i18n";
import { useOnboardingChecklist } from "../../logic/onboarding";
import { Account } from "../../storage/account";
import { TextButton } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { DaimoText, TextBody, TextH3 } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function OnboardingChecklistBottomSheet() {
  const Inner = useWithAccount(OnboardingChecklistBottomSheetInner);
  return <Inner />;
}
const i18 = i18n.onboardingChecklistBottom;

function OnboardingChecklistBottomSheetInner({
  account,
}: {
  account: Account;
}) {
  const { color, ss } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  const {
    hasBackup,
    farcasterConnected,
    handleSecureAccount,
    handleConnectFarcaster,
    dismissChecklist,
  } = useOnboardingChecklist(account);

  return (
    <View>
      <TextH3 style={{ textAlign: "center" }}>{i18.sheetHeader()}</TextH3>
      <Spacer h={16} />
      <TextBody style={{ textAlign: "center", color: color.grayMid }}>
        {i18.description()}
      </TextBody>
      <Spacer h={24} />
      <View style={styles.separator} />
      <ChecklistRow
        step={1}
        title={i18.secureAccount.title()}
        description={i18.secureAccount.description()}
        onPress={handleSecureAccount}
        done={hasBackup}
      />
      <ChecklistRow
        step={2}
        title={i18.connectFarcaster.title()}
        description={i18.connectFarcaster.description()}
        onPress={handleConnectFarcaster}
        done={farcasterConnected}
      />
      <Spacer h={16} />
      <View style={ss.container.padH24}>
        {dismissChecklist && (
          <TextButton title={i18.dismissButton()} onPress={dismissChecklist} />
        )}
      </View>
      <Spacer h={48} />
    </View>
  );
}

function ChecklistRow({
  step,
  title,
  description,
  onPress,
  done,
}: {
  step: number;
  title: string;
  description: string;
  onPress(): void;
  done: boolean;
}) {
  const { color, touchHighlightUnderlay } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <TouchableHighlight onPress={onPress} {...touchHighlightUnderlay.subtle}>
      <View style={styles.row}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ChecklistRowBubble step={step} done={done} />
          <Spacer w={16} />
          <View>
            <DaimoText color={done ? color.gray3 : color.midnight}>
              {title}
            </DaimoText>
            <DaimoText
              variant="metadata"
              color={done ? color.gray3 : color.grayMid}
            >
              {description}
            </DaimoText>
          </View>
        </View>
        {!done && (
          <Octicons name="arrow-right" color={color.primary} size={24} />
        )}
      </View>
    </TouchableHighlight>
  );
}

function ChecklistRowBubble({ step, done }: { step: number; done: boolean }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);
  return (
    <View
      style={[
        styles.rowLeft,
        { backgroundColor: done ? color.primary : color.gray3 },
      ]}
    >
      {done ? (
        <Octicons name="check" size={16} color={color.white} />
      ) : (
        <TextBody color={color.white}>{step}</TextBody>
      )}
    </View>
  );
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    separator: {
      height: 0.5,
      backgroundColor: color.grayLight,
      marginHorizontal: 24,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 24,
      marginHorizontal: 24,
      borderBottomWidth: 0.5,
      borderBottomColor: color.grayLight,
    },
    rowLeft: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 18,
      height: 36,
      width: 36,
    },
  });
