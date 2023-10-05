import { formatDaimoLink } from "@daimo/common";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useAccount } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import { Header } from "../../shared/Header";
import Spacer from "../../shared/Spacer";
import image from "../../shared/image";
import { useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextLight } from "../../shared/text";

export default function CreateRequestScreen() {
  const nav = useNav();
  const send = useCallback(() => nav.navigate("RequestSend"), [nav]);

  const [account] = useAccount();
  if (account == null) return null;

  const url = formatDaimoLink({ type: "account", account: account.name });

  return (
    <View style={ss.container.fullWidthSinglePage}>
      <Header />
      <Spacer h={64} />
      <View style={styles.vertMain}>
        <View style={styles.vertQR}>
          <QRCode
            value={url}
            color="#333"
            size={192}
            logo={{ uri: image.qrLogo }}
            logoSize={72}
          />
          <TextLight>Scan or tap</TextLight>
        </View>
        <Spacer h={32} />
        <TextLight>or</TextLight>
        <Spacer h={32} />
        <View style={styles.horzButtons}>
          <ButtonBig type="primary" title="Send Request" onPress={send} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  vertMain: {
    flexDirection: "column",
    alignItems: "center",
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
