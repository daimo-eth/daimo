import {
  DaimoLinkAccount,
  formatDaimoLink,
  formatDaimoLinkDirect,
  getAccountName,
  parseDaimoLink,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import { useRef, useState } from "react";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useAccount } from "../../model/account";
import { ButtonCircle } from "../shared/ButtonCircle";
import { Scanner } from "../shared/Scanner";
import { ScreenHeader, useExitBack } from "../shared/ScreenHeader";
import { SegmentSlider } from "../shared/SegmentSlider";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import { ParamListHome, QRScreenOptions } from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextCenter, TextH3, TextLight } from "../shared/text";

type Props = NativeStackScreenProps<ParamListHome, "QR">;

export function QRScreen(props: Props) {
  const { option } = props.route.params;
  const [tab, setTab] = useState<QRScreenOptions>(option || "PAY ME");
  const tabs = useRef(["PAY ME", "SCAN"] as QRScreenOptions[]).current;
  const title = tab === "PAY ME" ? "Display QR Code" : "Scan QR Code";

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onBack={useExitBack()} />
      <Spacer h={8} />
      <SegmentSlider {...{ tabs, tab, setTab }} />
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
      <View style={styles.accountShare}>
        <Spacer w={64} />
        <View>
          <TextCenter>
            <TextH3>{account.name}</TextH3>
          </TextCenter>
          <Spacer h={4} />
          <TextCenter>
            <TextLight>{getAccountName({ addr: account.address })}</TextLight>
          </TextCenter>
        </View>
        <ShareButton name={account.name} />
      </View>
    </View>
  );
}

export function ShareButton({ name }: { name: string }) {
  const link: DaimoLinkAccount = {
    type: "account",
    account: name,
  };

  const url = formatDaimoLink(link);

  const shareAccountLink = async () => {
    if (Platform.OS === "android") {
      await Share.share({ message: url });
    } else {
      await Share.share({ url }); // Default behavior for iOS
    }
  };

  return (
    <ButtonCircle onPress={shareAccountLink}>
      <View style={styles.shareCircle}>
        <Octicons name="share" size={24} color={color.midnight} />
      </View>
    </ButtonCircle>
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

    const directLink = formatDaimoLinkDirect(daimoLink);
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
  shareCircle: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: color.grayLight,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  accountShare: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
