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
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Linking, Platform, Share, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getAddress, isAddress } from "viem";

import { useAccount } from "../../model/account";
import { ButtonCircle } from "../shared/ButtonCircle";
import { Scanner } from "../shared/Scanner";
import { ScreenHeader } from "../shared/ScreenHeader";
import { SegmentSlider } from "../shared/SegmentSlider";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import {
  ParamListHome,
  QRScreenOptions,
  defaultError,
  useDisableTabSwipe,
  useExitBack,
  useExitToHome,
  useNav,
} from "../shared/nav";
import { color, ss } from "../shared/style";
import { TextCenter, TextH3, TextLight } from "../shared/text";

type Props = NativeStackScreenProps<ParamListHome, "QR">;

export function QRScreen(props: Props) {
  const { option } = props.route.params;
  const [tab, setTab] = useState<QRScreenOptions>(option || "PAY ME");
  const tabs = useRef(["PAY ME", "SCAN"] as QRScreenOptions[]).current;
  const title = tab === "PAY ME" ? "Display QR Code" : "Scan QR Code";

  const goBack = useExitBack();
  const goHome = useExitToHome();

  const nav = useNav();
  useDisableTabSwipe(nav);

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onBack={goBack || goHome} />
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

function ShareButton({ name }: { name: string }) {
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
    <ButtonCircle onPress={shareAccountLink} size={50} margin={16}>
      <View style={styles.shareCircle}>
        <Octicons name="share" size={24} color={color.midnight} />
      </View>
    </ButtonCircle>
  );
}

export function QRCodeBox({
  value,
  logoURI,
}: {
  value: string;
  logoURI?: string;
}) {
  if (logoURI == null) logoURI = image.qrLogo;

  return (
    <View style={styles.qrBackground}>
      <View style={styles.qrWrap}>
        <QRCode
          value={value}
          color={color.midnight}
          size={192}
          logo={{ uri: logoURI }}
          logoSize={64}
        />
      </View>
    </View>
  );
}

// Parse QR codes from Daimo or other wallets
// Works around potential deep linking / AASA bugs by using direct links only
function parseQRData(data: string) {
  if (isAddress(data)) {
    const addr = getAddress(data); // Convert to checksummed address
    console.log(`[SCAN] opening address ${addr}`);
    return formatDaimoLinkDirect({
      type: "account",
      account: addr,
    });
  } else {
    const universalURL = parseDaimoLink(data);
    // Workaround potential deep linking / AASA bugs by using direct links only
    return universalURL ? formatDaimoLinkDirect(universalURL) : null;
  }
}

function QRScan() {
  const [handled, setHandled] = useState(false);
  const nav = useNav();

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const link = parseQRData(data);
    if (link == null) return nav.navigate("LinkErrorModal", defaultError);
    setHandled(true);
    console.log(`[SCAN] opening URL ${link}`);
    await Linking.openURL(link);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
