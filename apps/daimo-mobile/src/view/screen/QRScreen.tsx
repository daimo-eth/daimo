import {
  DaimoLinkAccount,
  formatDaimoLink,
  getAddressContraction,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BarCodeScannedCallback } from "expo-barcode-scanner";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  ParamListHome,
  QRScreenOptions,
  defaultError,
  useExitBack,
  useExitToHome,
  useNav,
} from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { decodeQR } from "../../logic/decodeQR";
import { TextButton } from "../shared/Button";
import { ButtonCircle } from "../shared/ButtonCircle";
import { Scanner } from "../shared/Scanner";
import { ScreenHeader } from "../shared/ScreenHeader";
import { SegmentSlider } from "../shared/SegmentSlider";
import Spacer from "../shared/Spacer";
import image from "../shared/image";
import { TextCenter, TextH3, TextLight } from "../shared/text";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

type Props = NativeStackScreenProps<ParamListHome, "QR">;
const i18 = i18n.qr;

const tabs = ["PayMe", "Scan"] as QRScreenOptions[];
const localTabs = [i18.slider.payMe(), i18.slider.scan()];

export function QRScreen(props: Props) {
  const { ss } = useTheme();
  const { option } = props.route.params;
  const [tab, setTab] = useState<QRScreenOptions>(option || "PayMe");

  // Localization
  const localTab = localTabs[tabs.indexOf(tab)];
  const setLocalTab = (l: string) => setTab(tabs[localTabs.indexOf(l)]);

  const title = tab === "PayMe" ? i18.title.display() : i18.title.scan();

  const goBack = useExitBack();
  const goHome = useExitToHome();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title={title} onBack={goBack || goHome} />
      <Spacer h={8} />
      <SegmentSlider tabs={localTabs} tab={localTab} setTab={setLocalTab} />
      <Spacer h={24} />
      {tab === "PayMe" && <QRDisplay />}
      {tab === "Scan" && <QRScan />}
    </View>
  );
}

function QRDisplay() {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const [recentlyCopied, setRecentlyCopied] = useState(false);
  const account = useAccount();
  const nav = useNav();
  if (account == null) return null;

  const url = formatDaimoLink({ type: "account", account: account.name });

  const subtitle = recentlyCopied
    ? i18.copiedAddress()
    : getAddressContraction(account.address);

  const onLongPress = () => {
    console.log(`[QR] copying address ${account.address}`);
    Clipboard.setStringAsync(account.address);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentlyCopied(true);
    setTimeout(() => setRecentlyCopied(false), 1000);
  };

  const goToDeposit = () => {
    nav.navigate("DepositTab", {
      screen: "Deposit",
    });
  };

  return (
    <View>
      <QRCodeBox value={url} />
      <Spacer h={16} />
      <View style={styles.accountShare}>
        <Spacer w={64} />
        <Pressable onLongPress={onLongPress}>
          <TextCenter>
            <TextH3>{account.name}</TextH3>
          </TextCenter>
          <Spacer h={4} />
          <TextCenter>
            <TextLight>{subtitle}</TextLight>
          </TextCenter>
        </Pressable>
        <ShareButton name={account.name} />
      </View>
      <View style={styles.accountShare}>
        <TextButton title={i18.depositButton()} onPress={goToDeposit} />
      </View>
    </View>
  );
}

function ShareButton({ name }: { name: string }) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

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

function QRScan() {
  const [handled, setHandled] = useState(false);
  const nav = useNav();

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ data }) => {
    if (handled) return;

    const link = decodeQR(data);
    if (link == null) return nav.navigate("LinkErrorModal", defaultError);
    setHandled(true);
    console.log(`[SCAN] opening URL ${link}`);
    await Linking.openURL(link);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return <Scanner handleBarCodeScanned={handleBarCodeScanned} />;
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
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
