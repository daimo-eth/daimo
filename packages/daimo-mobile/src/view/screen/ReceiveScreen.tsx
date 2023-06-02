import { StyleSheet, View } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import QRCode from "react-native-qrcode-svg";
import { useAccount } from "../../logic/account";
import { HomeStackParamList } from "../HomeStack";
import { ButtonBig } from "../shared/Button";
import { Header } from "../shared/Header";
import image from "../shared/image";
import { TextSmall } from "../shared/text";

export default function DepositScreen() {
  const [account] = useAccount();
  const url = `daimo://request?recipient=${account.address}`;

  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const request = useCallback(() => nav.navigate("Request"), [nav]);
  const deposit = useCallback(() => nav.navigate("Deposit"), [nav]);

  return (
    <View style={styles.outerView}>
      <Header />
      <View style={styles.vertMain}>
        <View style={styles.vertQR}>
          <QRCode
            value={url}
            color="#333"
            size={192}
            logo={{ uri: image.ethLogo }}
            logoSize={48}
            logoBorderRadius={24}
            logoBackgroundColor="#fff"
          />
          <TextSmall>Scan or tap</TextSmall>
        </View>
        <TextSmall>or</TextSmall>
        <View style={styles.horzButtons}>
          <ButtonBig title="Request" onPress={request} />
          <ButtonBig title="Deposit" onPress={deposit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 16,
  },
  vertMain: {
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 32,
    gap: 32,
  },
  vertQR: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  horzButtons: {
    flexDirection: "row",
    gap: 24,
  },
});
