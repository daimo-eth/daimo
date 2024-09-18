import { View } from "react-native";
import WebView from "react-native-webview";

import { useNav } from "../../../common/nav";
import { useAccount } from "../../../logic/accountManager";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { useTheme } from "../../style/theme";

const LANDLINE_URL = "https://embed.landline.daimo.xyz"; // TODO

export function LandlineWebView() {
  const { ss } = useTheme();
  const nav = useNav();
  const goBack = () => nav.goBack();
  const account = useAccount();

  if (!account) return null;

  // TODO: need anything else?
  const config = {
    daimoAccount: account.address,
  };

  return (
    <View style={ss.container.screenWithoutPadding}>
      <View style={ss.container.padH16}>
        <ScreenHeader title="Bitrefill" onExit={goBack} />
      </View>
      <WebView
        source={{
          uri: `${LANDLINE_URL}/?${new URLSearchParams(config)}`,
        }}
        onError={(error) => console.error("[LANDLINE]", error)}
      />
    </View>
  );
}
