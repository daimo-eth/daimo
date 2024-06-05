import { daimoDomainAddress } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ResizeMode, Video } from "expo-av";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";

import { OnboardingHeader, getNumOnboardingSteps } from "./OnboardingHeader";
import VidBellAnimation from "../../../../assets/onboarding/bell-animation.mp4";
import { ParamListOnboarding, useOnboardingNav } from "../../../common/nav";
import { env } from "../../../env";
import { useDaimoChain } from "../../../logic/accountManager";
import { useNotificationsAccess } from "../../../logic/notify";
import { ButtonBig, TextButton } from "../../shared/Button";
import { CoverVideo } from "../../shared/CoverGraphic";
import Spacer from "../../shared/Spacer";
import { color, ss } from "../../shared/style";
import { TextBodyMedium, TextCenter } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListOnboarding, "AllowNotifs">;

// This screen shows final steps for onboarding (eg allow notifications),
// then a spinner while waiting for account creation, or error.
export function AllowNotifsScreen({ route }: Props) {
  const { showProgressBar } = route.params;
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

  // Show progress if needed
  const steps = showProgressBar ? getNumOnboardingSteps() : undefined;
  const activeStep = steps ? steps - 1 : undefined;

  return (
    <View style={ss.container.flexGrow}>
      <OnboardingHeader title="Notifications" {...{ steps, activeStep }} />
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
    <View style={ss.container.topBottom}>
      <View key="top" style={ss.container.padH24}>
        {displayMacVideo ? (
          <MacNotificationsVideo />
        ) : (
          <CoverVideo video={VidBellAnimation} />
        )}
        <Spacer h={32} />
        <Instructions />
      </View>
      <View key="bottom" style={ss.container.padH24}>
        {displayMacVideo ? (
          <>
            <Spacer h={16} />
            <TextButton title="Skip" onPress={skip} />
            <Spacer h={16} />
          </>
        ) : (
          <>
            <Spacer h={16} />
            <ButtonBig
              type="primary"
              title="Allow Notifications"
              onPress={requestPermission}
            />
            <Spacer h={16} />
            <TextButton title="Skip" onPress={skip} />
            <Spacer h={16} />
          </>
        )}
      </View>
    </View>
  );
}

function Instructions() {
  return (
    <TextCenter>
      <TextBodyMedium color={color.grayMid}>
        You will only be notified about activity on your account.
      </TextBodyMedium>
    </TextCenter>
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
