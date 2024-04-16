import { daimoDomainAddress } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { ResizeMode, Video } from "expo-av";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { OnboardingHeader } from "./OnboardingHeader";
import { useOnboardingNav } from "../../../common/nav";
import { useDaimoChain } from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { useNotificationsAccess } from "../../../logic/notify";
import { ButtonBig, TextButton } from "../../shared/Button";
import { IntroTextParagraph } from "../../shared/IntroTextParagraph";
import Spacer from "../../shared/Spacer";
import { color } from "../../shared/style";
import { TextCenter } from "../../shared/text";

// This screen shows final steps for onboarding (eg allow notifications),
// then a spinner while waiting for account creation, or error.
export function OnboardingAllowNotifsScreen() {
  const notificationsAccess = useNotificationsAccess();

  const daimoChain = useDaimoChain();
  const [displayMacVideo, setDisplayMacVideo] = useState<boolean>(false);

  // Request notifications permission
  const nav = useOnboardingNav();
  const finish = useCallback(() => nav.navigate("Finish"), []);

  const requestNotificationsPermission = async () => {
    console.log(`[ONBOARDING] requesting notifications access`);
    setDisplayMacVideo(env(daimoChain).deviceType === "computer");
    await notificationsAccess.ask();
    finish();
  };

  return (
    <View>
      <OnboardingHeader title="Notifications" />
      <RequestNotificationsPage
        displayMacVideo={displayMacVideo}
        requestPermission={requestNotificationsPermission}
        skip={finish}
      />
    </View>
  );
}

function RequestNotificationsPage({
  requestPermission,
  skip,
  displayMacVideo,
}: {
  requestPermission: () => Promise<void>;
  skip: () => void;
  displayMacVideo: boolean;
}) {
  return (
    <View style={styles.paddedPage}>
      {displayMacVideo ? (
        <MacNotificationsVideo />
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
          <TextButton title="Skip" onPress={skip} />
        </>
      ) : (
        <>
          <Spacer h={124} />
          <ButtonBig
            type="primary"
            title="Allow Notifications"
            onPress={requestPermission}
          />
          <Spacer h={16} />
          <TextButton title="Skip" onPress={skip} />
        </>
      )}
    </View>
  );
}

function MacNotificationsVideo() {
  const video = useRef(null);
  return (
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
      onError={(err: any) => {
        console.error("[ONBOARDING] Mac video loading error: ", err);
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
  );
}

const styles = StyleSheet.create({
  paddedPage: {
    paddingTop: 36,
    paddingHorizontal: 24,
  },
});
