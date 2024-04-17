import { AVPlaybackSource, ResizeMode, Video } from "expo-av";
import { Image, StyleSheet, View } from "react-native";

import DepositCover from "../../../assets/deposit-cover.png";
import InviteCover from "../../../assets/invite-cover.png";

export function CoverVideo({ video }: { video: AVPlaybackSource }) {
  return (
    <Video
      style={{
        width: 224,
        height: 165,
        alignSelf: "center",
      }}
      source={video}
      onError={(err: any) => {
        console.error("[ONBOARDING] video loading error: ", err);
      }}
      onLoad={() => {
        console.log("[ONBOARDING] video loaded");
      }}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      useNativeControls={false}
      volume={0}
    />
  );
}

export function CoverGraphic({ type }: { type: "invite" | "deposit" }) {
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
