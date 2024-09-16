import { appStoreLinks } from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { useMemo } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";

import { ButtonBig } from "./Button";
import Spacer from "./Spacer";
import { DaimoText, TextCenter, TextError, TextH3 } from "./text";
import { useExitToHome } from "../../common/nav";
import { Colorway } from "../style/skins";
import { useTheme } from "../style/theme";

export function ErrorRowCentered({
  error,
  message,
}: {
  error?: { message?: string };
  message?: string;
}) {
  let msg = message ?? error?.message ?? "Unknown error";
  console.log(`[ERROR] rendering ${msg}`, error);

  if (msg.toLowerCase() === "network request failed") {
    msg = "Request failed. Offline?";
  } else if (msg.length > 200) {
    msg = msg.slice(0, 200) + "...";
  }

  return (
    <TextCenter>
      <TextError>{msg}</TextError>
    </TextCenter>
  );
}

export function ErrorBanner({
  error,
  displayTitle,
  displayMessage,
  showDownloadButton,
  onGoHome,
}: {
  error?: { message?: string };
  displayTitle: string;
  displayMessage?: string;
  showDownloadButton?: boolean;
  onGoHome?: () => void;
}) {
  const { color } = useTheme();
  const styles = useMemo(() => getStyles(color), [color]);

  const exitToHome = useExitToHome();
  const goHomeScreen = onGoHome || exitToHome;
  const goAppStore = () => {
    if (Platform.OS === "android") Linking.openURL(appStoreLinks.android);
    else Linking.openURL(appStoreLinks.ios);
  };

  console.log(`[ERROR] rendering ${error?.message || "unknown error"}`, error);

  return (
    <View style={styles.container}>
      <View style={styles.closeCircle}>
        <Octicons name="x" size={74} color={color.danger} />
      </View>

      <TextH3>{displayTitle}</TextH3>

      <View style={styles.messageContainer}>
        <DaimoText style={styles.message}>{displayMessage}</DaimoText>
      </View>
      <View style={styles.buttonContainer}>
        {showDownloadButton && (
          <>
            <ButtonBig
              type="primary"
              title="Download latest version"
              onPress={goAppStore}
            />
            <Spacer h={16} />
          </>
        )}
        <ButtonBig
          type={showDownloadButton ? "subtle" : "primary"}
          title="Back to homepage"
          onPress={goHomeScreen}
        />
        <Spacer h={16} />
        <ButtonBig
          type="subtle"
          title="Contact Support"
          onPress={openSupportTG}
        />
      </View>
    </View>
  );
}

export function openSupportTG() {
  console.log("[ERROR] Opening Telegram support");
  Linking.openURL("https://t.me/daimo_support");
}

const getStyles = (color: Colorway) =>
  StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
    },
    closeCircle: {
      height: 128,
      width: 128,
      borderWidth: 1,
      borderColor: color.danger,
      borderRadius: 64,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    closeIcon: {
      height: 36,
      width: 36,
    },
    message: {
      textAlign: "center",
      fontWeight: "600",
      color: color.grayMid,
      lineHeight: 24,
      fontSize: 16,
    },
    messageContainer: {
      paddingTop: 16,
    },
    buttonContainer: {
      width: "100%",
      marginTop: 24,
    },
  });
