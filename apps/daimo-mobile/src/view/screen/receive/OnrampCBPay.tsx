import { generateOnRampURL } from "@coinbase/cbpay-js";
import React, { useCallback, useMemo } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { Address } from "viem";
import "react-native-url-polyfill/auto";

export function CBPayWebView({
  destAddress,
  onExit,
}: {
  destAddress: Address;
  onExit: () => void;
}) {
  const coinbaseURL = useMemo(
    () =>
      generateOnRampURL({
        appId: "2be3ccd9-6ee4-4dba-aba8-d4b458fe476d",
        destinationWallets: [
          {
            address: destAddress,
            blockchains: ["base"],
            assets: ["USDC"],
            supportedNetworks: ["base"],
          },
        ],
        handlingRequestedUrls: true,
        defaultExperience: "send",
      }),
    [destAddress]
  );

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    // Check for Success and Error Messages here
    console.log("[CB] webview message", event.nativeEvent.data);
    const { data } = JSON.parse(event.nativeEvent.data);
    switch (data.eventName) {
      case "open":
        break;
      case "request_open_url":
        console.log(`[CB] TODO request_open_url ${data.url}`);
        break;
      case "transition_view":
        console.log(`[CB] transition to ${data.pageRoute}`);
        break;
      case "success":
        console.log(`[CB] onramp success`);
        break;
      case "exit":
        onExit();
        break;
      default:
        console.warn(`[CB] unknown event ${data.eventName}`);
    }
  }, []);

  return (
    <WebView
      source={{ uri: coinbaseURL }}
      onMessage={onMessage}
      originWhitelist={["*"]}
    />
  );
}
