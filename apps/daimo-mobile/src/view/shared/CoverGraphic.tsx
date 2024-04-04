import { View, StyleSheet, Image } from "react-native";

import DepositCover from "../../../assets/deposit-cover.png";
import InviteCover from "../../../assets/invite-cover.png";

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
