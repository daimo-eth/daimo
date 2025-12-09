import { debugJson } from "@daimo/common";
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { Account } from "../../../storage/account";

type DaimoPayWebViewProps = {
  account: Account;
  visible: boolean;
  onClose: () => void;
};

export function DaimoPayWebView({
  account,
  visible,
  onClose,
}: DaimoPayWebViewProps) {
  const styles = useMemo(() => getStyles(), []);

  // The /embed webpage emits a message when the user closes the modal.
  // When this happens, close the webview.
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log(`[DAIMO PAY] Received message: ${debugJson(data)}`);
        if (data?.source !== "daimo-pay") return;
        if (data.type === "modalClosed") {
          onClose();
        }
      } catch (err) {
        console.error("[DAIMO PAY] Unable to parse postMessage payload", err);
      }
    },
    [onClose]
  );

  if (!visible) return null;

  const url = buildDaimoPayUrl(account);

  return (
    <View style={styles.overlay}>
      <WebView
        source={{ uri: url }}
        style={{ flex: 1, backgroundColor: "transparent" }}
        containerStyle={{ backgroundColor: "transparent" }}
        javaScriptEnabled
        onMessage={handleMessage}
        onError={(e) => console.error("[DAIMO PAY] WebView error", e)}
      />
    </View>
  );
}

function buildDaimoPayUrl(account: Account) {
  const baseUrl = "https://miniapp.daimo.com/embed";
  const params = new URLSearchParams({
    toAddress: account.address,
    refundAddress: "0xDa130a3573e1a5F54f1B7C2F324bf5d4F89b3c27",
    toChain: account.homeChainId.toString(),
    toToken: account.homeCoinAddress,
    intent: "Deposit to Daimo",
    paymentOptions: "Coinbase,Solana",
  });

  return `${baseUrl}?${params.toString()}`;
}

const getStyles = () =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "transparent",
      zIndex: 1000,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: 16,
      zIndex: 1001,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
    },
  });
