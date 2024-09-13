import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ParamListMain } from "../../common/nav";
import { SendDebugLogButton } from "../../common/useSendDebugLog";
import { i18n } from "../../i18n";
import ScrollPellet from "../shared/ScrollPellet";
import Spacer from "../shared/Spacer";
import { ErrorBanner } from "../shared/error";
import { useTheme } from "../style/theme";

type Props = NativeStackScreenProps<ParamListMain, "LinkErrorModal">;
const i18 = i18n.error;

export function ErrorScreen(props: Props) {
  const { displayTitle, displayMessage, showDownloadButton } =
    props.route.params;
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentContainer,
          {
            paddingBottom: 32 + bottom,
          },
        ]}
      >
        <ScrollPellet />
        <Spacer h={20} />
        <ErrorBanner
          displayTitle={displayTitle}
          displayMessage={displayMessage}
          showDownloadButton={showDownloadButton}
        />
      </View>
    </View>
  );
}

export function renderErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <ErrorFallbackComponent
      error={error}
      resetErrorBoundary={resetErrorBoundary}
    />
  );
}

function ErrorFallbackComponent({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  const { ss } = useTheme();
  return (
    <View style={ss.container.screen}>
      <View style={ss.container.padH8}>
        <Spacer h={192} />
        <ErrorBanner
          displayTitle={i18.banner()}
          error={error}
          onGoHome={resetErrorBoundary}
        />
        <Spacer h={16} />
        <SendDebugLogButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  contentContainer: {
    backgroundColor: "white",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
