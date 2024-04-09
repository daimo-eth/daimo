import { useMemo } from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";

import DepositCover from "../../../assets/deposit-cover.png";
import InviteCover from "../../../assets/invite-cover.png";
import OnboardingCover from "../../../assets/onboarding-cover.png";

export function Cover({
  source,
  width,
  height,
}: {
  source: ImageSourcePropType;
  width?: number;
  height?: number;
}) {
  const style = useMemo(() => ({ width, height }), [width, height]);
  return (
    <View style={styles.imgContainer}>
      <Image source={source} style={style} />
    </View>
  );
}

export function CoverGraphic({
  type,
}: {
  type: "invite" | "deposit" | "onboarding";
}) {
  return (
    <View style={styles.imgContainer}>
      <Image
        source={graphics[type].image}
        style={{ ...styles.image, aspectRatio: graphics[type].aspectRatio }}
      />
    </View>
  );
}

const graphics = {
  invite: {
    image: InviteCover,
    aspectRatio: 2.2,
  },
  deposit: {
    image: DepositCover,
    aspectRatio: 1.925,
  },
  onboarding: {
    image: OnboardingCover,
    aspectRatio: 0.9437,
  },
};

const styles = StyleSheet.create({
  imgContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "contain",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
