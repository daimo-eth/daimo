import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { formatDaimoLink } from "../../../logic/link";
import { useAccount } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import { Header } from "../../shared/Header";
import image from "../../shared/image";
import { useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextSmall } from "../../shared/text";

export default function ReceiveScreen() {
  const nav = useNav();
  const request = useCallback(() => nav.navigate("Request"), [nav]);
  const deposit = useCallback(() => nav.navigate("Deposit"), [nav]);

  const [account] = useAccount();
  if (account == null) return null;

  const url = formatDaimoLink({ type: "receive", addr: account.address });

  return (
    <View style={ss.container.outerStretch}>
      <Header />
      <View style={styles.vertMain}>
        <View style={styles.vertQR}>
          <QRCode
            value={url}
            color="#333"
            size={192}
            logo={{ uri: image.qrLogo }}
            logoSize={72}
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
