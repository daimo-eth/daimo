import { daimoDomainAddress } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import Octicons from "@expo/vector-icons/Octicons";
import { Video, ResizeMode } from "expo-av";
import { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { env } from "../../../logic/env";
import {
  getPushNotificationManager,
  useNotificationsAccess,
} from "../../../logic/notify";
import { ButtonBig, TextButton } from "../../shared/Button";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter } from "../../shared/text";

export function AllowNotificationsPage({
  onNext,
  daimoChain,
}: {
  onNext: () => void;
  daimoChain: DaimoChain;
}) {
  const notificationsAccess = useNotificationsAccess();

  const video = useRef(null);
  const [displayMacVideo, setDisplayMacVideo] = useState<boolean>(false);

  const allowNotifications = async () => {
    if (!notificationsAccess.permission?.granted) {
      console.log(`[ONBOARDING] requesting notifications access`);
      setDisplayMacVideo(env(daimoChain).deviceType === "computer");
      await notificationsAccess.ask();
    }

    getPushNotificationManager().maybeSavePushTokenForAccount();

    onNext();
  };

  return (
    <View>
      <OnboardingHeader title="Notifications" />
      <View style={styles.paddedPage}>
        {displayMacVideo ? (
          <Video
            ref={video}
            style={{
              backgroundColor: color.primary,
              alignSelf: "center",
              borderRadius: 8,
              // Hardcoded from actual video size, prevents glitchy jump on load
              width: 377,
              height: 145,
            }}
            source={{
              uri: `${daimoDomainAddress}/assets/macos-notifs-explainer.mp4`,
            }}
            onError={(err) => {
              console.log("[ONBOARDING] Mac video loading error: ", err);
            }}
            onLoad={() => {
              console.log("[ONBOARDING] Mac video loaded");
            }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            useNativeControls={false}
            volume={0}
          />
        ) : (
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Octicons name="mail" size={40} color={color.midnight} />
          </View>
        )}
        <Spacer h={32} />
        <TextCenter>
          <IntroTextParagraph>
            You will only be notified about account activity. For example, when
            you receive money.
          </IntroTextParagraph>
        </TextCenter>
        {displayMacVideo ? (
          <>
            <Spacer h={32} />
            <TextButton title="Skip" onPress={onNext} />
          </>
        ) : (
          <>
            <Spacer h={124} />
            <ButtonBig
              type="primary"
              title="Allow Notifications"
              onPress={allowNotifications}
            />
            <Spacer h={16} />
            <TextButton title="Skip" onPress={onNext} />
          </>
        )}
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
