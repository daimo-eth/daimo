import { useEffect } from "react";
import { BackHandler, View } from "react-native";

import { ScreenHeader } from "../../shared/ScreenHeader";
import { ss } from "../../shared/style";

export function OnboardingHeader({
  title,
  onPrev,
}: {
  title: string;
  onPrev?: () => void;
}) {
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

  return (
    <View style={ss.container.padH16}>
      <ScreenHeader title={title} onBack={onPrev} />
    </View>
  );
}
