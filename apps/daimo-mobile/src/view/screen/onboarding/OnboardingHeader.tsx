import { useEffect } from "react";
import { BackHandler, View, StyleSheet, Platform } from "react-native";

import { ProgressBlobs } from "../../shared/ProgressBlobs";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { useTheme } from "../../style/theme";

export function getNumOnboardingSteps() {
  return Platform.OS === "ios" ? 3 : 4;
}

export function OnboardingHeader({
  title,
  onPrev,
  steps,
  activeStep,
}: {
  title: string;
  onPrev?: () => void;
  steps?: number;
  activeStep?: number;
}) {
  const { ss } = useTheme();

  /* On Android, listen for the native back button. */
  useEffect(() => {
    if (!onPrev) return;
    const onBack = () => {
      onPrev();
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => BackHandler.removeEventListener("hardwareBackPress", onBack);
  }, [onPrev]);

  const secondaryHeader = steps != null && activeStep != null && (
    <View style={styles.progressWrap}>
      <ProgressBlobs steps={steps} activeStep={activeStep} />
    </View>
  );

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader {...{ title, secondaryHeader }} onBack={onPrev} />
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
});
