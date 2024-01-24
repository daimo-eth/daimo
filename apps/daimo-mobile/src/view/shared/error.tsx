import Octicons from "@expo/vector-icons/Octicons";
import { StyleSheet, View } from "react-native";

import { ButtonBig } from "./Button";
import Spacer from "./Spacer";
import { useNav } from "./nav";
import { color } from "./style";
import { DaimoText, TextCenter, TextError, TextH3 } from "./text";

export function ErrorRowCentered({ error }: { error: { message?: string } }) {
  let message = error.message ?? "Unknown error";
  console.log(`[ERROR] rendering ${message}`, error);

  if (message.toLowerCase() === "network request failed") {
    message = "Request failed. Offline?";
  } else if (message.length > 200) {
    message = message.slice(0, 200) + "...";
  }

  return (
    <TextCenter>
      <TextError>{message}</TextError>
    </TextCenter>
  );
}

export function ErrorBanner({
  error,
  displayTitle,
  displayMessage,
  showDownloadButton,
}: {
  error?: { message?: string };
  displayTitle: string;
  displayMessage?: string;
  showDownloadButton?: boolean;
}) {
  const nav = useNav();
  const goHomeScreen = () => nav.popToTop();
  const goAppStore = () => {};
  console.log(
    `[ERROR] rendering ${error?.message || "Unknown message"}`,
    error
  );

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
