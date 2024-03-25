import Octicons from "@expo/vector-icons/Octicons";
import { useCallback, useContext, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { DispatcherContext } from "../../action/dispatch";
import { useNav } from "../../common/nav";
import { Account } from "../../model/account";
import { ButtonBig } from "../shared/Button";
import Spacer from "../shared/Spacer";
import { color } from "../shared/style";
import { DaimoText, TextBody, TextH3 } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

export function OnboardingChecklistBottomSheet() {
  const Inner = useWithAccount(OnboardingChecklistBottomSheetInner);
  return <Inner />;
}

function OnboardingChecklistBottomSheetInner({
  account,
}: {
  account: Account;
}) {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const farcasterConnected = useMemo(() => {
    return account.linkedAccounts.length > 0;
  }, [account.linkedAccounts.length]);

  const handleSecureAccount = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "hideBottomSheet" });
  }, [nav, dispatcher]);

  const handleConnectFarcaster = useCallback(() => {
    nav.navigate("Settings");
    dispatcher.dispatch({ name: "connectFarcaster" });
  }, [nav, dispatcher]);

  const dismissSheet = useCallback(() => {
    dispatcher.dispatch({ name: "hideBottomSheet" });
  }, [dispatcher]);

  return (
    <View style={{ paddingHorizontal: 24 }}>
      <TextH3 style={{ textAlign: "center" }}>Onboarding checklist</TextH3>
      <Spacer h={16} />
      <TextBody style={{ textAlign: "center", color: color.grayMid }}>
        Complete these items to finish account setup
      </TextBody>
      <Spacer h={24} />
      <View style={styles.separator} />
      <ChecklistRow
        step={1}
        title="Secure your account"
        description="Add a passkey backup to your account"
        onPress={handleSecureAccount}
        done={false}
      />
      <ChecklistRow
        step={2}
        title="Connect Farcaster"
        description="Import your profile image and connections"
        onPress={handleConnectFarcaster}
        done={farcasterConnected}
      />
      <Spacer h={24} />
      <ButtonBig
        type="subtle"
        title={`I'll get to it later`}
        onPress={dismissSheet}
      />
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
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
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
        <Spacer w={16} />
        <View>
          <DaimoText>{title}</DaimoText>
          <DaimoText variant="metadata" color={color.grayMid}>
            {description}
          </DaimoText>
        </View>
      </View>
      <Octicons name="arrow-right" color={color.primary} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 0.5,
    backgroundColor: color.grayLight,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    paddingVertical: 24,
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
