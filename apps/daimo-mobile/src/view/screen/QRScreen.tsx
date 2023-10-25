import {
  daimoLinkBase,
  formatDaimoLink,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useRef, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useAccount } from "../../model/account";
import { Scanner } from "../shared/Scanner";
import { ScreenHeader, useExitToHome } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import { color, ss } from "../shared/style";
import { TextCenter, TextH3, TextLight } from "../shared/text";

type Tab = "PAY ME" | "SCAN";

export function QRScreen() {
  const [tab, setTab] = useState<Tab>("PAY ME");
  const tabs = useRef(["PAY ME", "SCAN"] as Tab[]).current;
  const title = tab === "PAY ME" ? "Display QR Code" : "Scan QR Code";

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onBack={useExitToHome()} />
      <Spacer h={8} />
      <SegmentedControl
        values={tabs}
        onValueChange={setTab as (tab: string) => void}
        selectedIndex={tabs.indexOf(tab)}
        fontStyle={{ ...ss.text.body, color: color.grayDark }}
        activeFontStyle={{ ...ss.text.body, color: color.midnight }}
        style={{ height: 48, backgroundColor: color.ivoryDark }}
      />
      <Spacer h={24} />
      {tab === "PAY ME" && <QRDisplay />}
      {tab === "SCAN" && <QRScan />}
    </View>
  );
}

function QRDisplay() {
  const [account] = useAccount();
  if (account == null) return null;

  const url = formatDaimoLink({ type: "account", account: account.name });

  return (
    <View>
      <QRCodeBox value={url} />
      <Spacer h={16} />
      <TextCenter>
        <TextH3>{account.name}</TextH3>
      </TextCenter>
      <Spacer h={4} />
      <TextCenter>
        <TextLight>{getAccountName({ addr: account.address })}</TextLight>
      </TextCenter>
    </View>
  );
}

export function QRCodeBox({ value }: { value: string }) {
  return (
    <View style={styles.qrBackground}>
      <View style={styles.qrWrap}>
        <QRCode
          value={value}
          color={color.midnight}
          size={192}
          logo={{ uri: image.qrLogo }}
          logoSize={72}
        />
      </View>
    </View>
  );
}

function QRScan() {
  const [handled, setHandled] = useState(false);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const daimoLink = parseDaimoLink(data);
    if (daimoLink == null) return;
    setHandled(true);

    let directLink: string;
    if (data.startsWith(daimoLinkBase + "/")) {
      directLink = "daimo://" + data.substring(daimoLinkBase.length + 1);
    } else {
      directLink = data;
    }

    console.log(`[SCAN] opening URL ${directLink}`);
    Linking.openURL(directLink);
  };

  return <Scanner handleBarCodeScanned={handleBarCodeScanned} />;
}

const styles = StyleSheet.create({
  qrBackground: {
    backgroundColor: color.ivoryDark,
    borderRadius: 8,
    paddingVertical: 40,
    flexDirection: "row",
    justifyContent: "center",
  },
  qrWrap: {
    borderWidth: 1,
    borderColor: color.primary,
    borderRadius: 8,
    padding: 16,
    backgroundColor: color.white,
  },
});
