import { StyleSheet, View, Text } from "react-native";

import { useAccount } from "../../logic/account";
import { Header } from "../shared/Header";
import { ss } from "../shared/style";
import QRCode from "react-native-qrcode-svg";
import { ButtonBig } from "../shared/Button";
import image from "../shared/image";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import { HomeStackParamList } from "../HomeStack";

export default function DepositScreen() {
  const [account] = useAccount();
  const url = `https://google.com?q=${account.address}`;

  const nav = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const sendRequest = useCallback(() => {
    // TODO
  }, [nav]); // TODO
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
          <Text style={ss.text.bodyGray}>Scan or tap</Text>
        </View>
        <Text style={ss.text.bodyGray}>or</Text>
        <View style={styles.horzButtons}>
          <ButtonBig title="Send Request" onPress={sendRequest} />
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
    gap: 16,
  },
});
