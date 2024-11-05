import { useContext } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { getAddress } from "viem";

import { DispatcherContext } from "../../../action/dispatch";
import { useNav } from "../../../common/nav";
import { i18NLocale } from "../../../i18n";
import { parsePaymentUri } from "../../../logic/paymentURI";
import { ScreenHeader } from "../../shared/ScreenHeader";
import { useTheme } from "../../style/theme";

export function BitrefillWebView() {
  const nav = useNav();
  const dispatcher = useContext(DispatcherContext);

  const handleMessage = (e: any) => {
    const { event, paymentUri } = JSON.parse(e.nativeEvent.data);

    switch (event) {
      case "payment_intent": {
        console.log(`[BITREFILL] payment_intent ${paymentUri}`);

        try {
          const parsedUri = parsePaymentUri(paymentUri);

          dispatcher.dispatch({
            name: "bitrefill",
            address: getAddress(parsedUri.recipientAddress),
            amount: parsedUri.amount,
          });
        } catch (error) {
          console.error("[BITREFILL] Failed to parse payment URI:", error);
        }
        break;
      }
      case "invoice_update":
      case "invoice_complete": {
        console.log(`[BITREFILL] ${event} ${paymentUri}`);
        dispatcher.dispatch({
          name: "hideBottomSheet",
        });
        break;
      }
      default:
        console.log(`[BITREFILL] event ${event}`);
        break;
    }
  };

  // Bitrefill only supports a few language codes, so we check if the user's
  // language code is supported and use that, otherwise we default to English.
  // If we don't do this, Bitrefill will show the user an ugly error.
  const availableBitrefillLanguages = [
    "en",
    "ru",
    "fr",
    "es",
    "de",
    "pt",
    "vi",
    "it",
    "ja",
  ];

  const hl =
    i18NLocale.languageCode &&
    availableBitrefillLanguages.includes(i18NLocale.languageCode)
      ? i18NLocale.languageCode
      : "en";

  const config = {
    theme: "light",
    ref: "FebSoTqs",
    paymentMethod: "usdc_polygon",
    utm_source: "daimo",
    hl,
  };

  const goBack = () => nav.goBack();
  const { ss } = useTheme();

  return (
    <View style={ss.container.screenWithoutPadding}>
      <View style={ss.container.padH16}>
        <ScreenHeader title="Bitrefill" onExit={goBack} />
      </View>
      <WebView
        source={{
          uri: `https://embed.bitrefill.com/?${new URLSearchParams(config)}`,
        }}
        onMessage={handleMessage}
        onError={(error) => console.error("[BITREFILL]", error)}
      />
    </View>
  );
}
