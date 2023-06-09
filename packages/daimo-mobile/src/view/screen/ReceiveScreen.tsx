import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useAccount } from "../../logic/account";
import { ButtonBig } from "../shared/Button";
import { Header } from "../shared/Header";
import image from "../shared/image";
import { useNav } from "../shared/nav";
import { ss } from "../shared/style";
import { TextSmall } from "../shared/text";
import { assert } from "../../logic/assert";

export default function DepositScreen() {
  const [account] = useAccount();
  assert(account != null);
  const url = `daimo://request?recipient=${account.address}`;

  const nav = useNav();
  const request = useCallback(() => nav.navigate("Request"), [nav]);
  const deposit = useCallback(() => nav.navigate("Deposit"), [nav]);

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
