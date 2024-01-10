import Octicons from "@expo/vector-icons/Octicons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { View, StyleSheet } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { getPushNotificationManager } from "../../../logic/notify";
import { ButtonBig, TextButton } from "../../shared/Button";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter } from "../../shared/text";

export function AllowNotificationsPage({ onNext }: { onNext: () => void }) {
  const requestPermission = async () => {
    if (!Device.isDevice) {
      window.alert("Push notifications unsupported in simulator.");
      return;
    }

    const status = await Notifications.requestPermissionsAsync();
    console.log(`[ONBOARDING] notifications request ${status.status}`);
    if (!status.granted) return;

    getPushNotificationManager().maybeSavePushTokenForAccount();

    onNext();
  };

  return (
    <View>
      <OnboardingHeader title="Notifications" />
      <View style={styles.paddedPage}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Octicons name="mail" size={40} color={color.midnight} />
        </View>
        <Spacer h={32} />
        <TextCenter>
          <IntroTextParagraph>
            You will only be notified about account activity. For example, when
            you receive money.
          </IntroTextParagraph>
        </TextCenter>
        <Spacer h={124} />
        <ButtonBig
          type="primary"
          title="Allow Notifications"
          onPress={requestPermission}
        />
        <Spacer h={16} />
        <TextButton title="Skip" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
