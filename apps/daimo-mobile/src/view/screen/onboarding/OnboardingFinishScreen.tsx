import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import {
  getAccountManager,
  useAccountAndKeyInfo,
} from "../../../logic/accountManager";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import {
  EmojiToOcticon,
  TextCenter,
  TextError,
  TextLight,
} from "../../shared/text";

// Show a spinner while waiting for account creation, or error.
export function OnboardingFinishScreen() {
  const { account, createAccountHandle } = useAccountAndKeyInfo();
  const { status, message, retry } = createAccountHandle || {};

  // On success, mark account as onboarded, showing home screen.
  useEffect(() => {
    console.log(`[ONBOARDING] loading status ${status}`);
    if (account == null && status !== "success") return;
    getAccountManager().transform((a) => ({ ...a, isOnboarded: true }));
  }, [status, account]);

  return (
    <View style={ss.container.center}>
      {status !== "error" && <ActivityIndicator size="large" />}
      {status === "error" && retry && (
        <View style={{ paddingHorizontal: 32, alignSelf: "stretch" }}>
          <ButtonBig title="Retry" onPress={retry} type="primary" />
        </View>
      )}
      <Spacer h={32} />
      <TextCenter>
        {status === "error" && <TextError>{message}</TextError>}
        {status !== "error" && (
          <TextLight>
            <EmojiToOcticon size={16} text={message || ""} />
          </TextLight>
        )}
      </TextCenter>
    </View>
  );
}
