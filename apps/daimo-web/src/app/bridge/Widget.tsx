"use client";

import { getChainConfig } from "@daimo/contract";
import { LiFiWidget, WidgetConfig } from "@lifi/widget";
import { useMemo } from "react";
import { Address } from "viem";

import { chainConfig } from "../../env";

const widgetConfigBase: WidgetConfig = {
  integrator: "daimo",
  variant: "default",
  subvariant: "default",
  appearance: "light",
  buildUrl: false,
  disabledUI: ["toAddress", "toToken"],
  hiddenUI: ["appearance", "language"],
  slippage: 0.005,
  containerStyle: {
    border: "1px solid rgb(234, 234, 234)",
    borderRadius: "16px",
    maxHeight: "1200px",
  },
  languages: {
    default: "en",
    allow: ["en"],
  },
};

export function Widget({
  toName,
  toAddress,
}: {
  toName: string;
  toAddress: Address;
}) {
  const widgetConfig = useMemo<WidgetConfig>(
    () => ({
      ...widgetConfigBase,
      languageResources: {
        en: {
          header: {
            exchange: "Deposit to Daimo",
          },
          main: {
            sendToWallet: `Send to ${toName} on Daimo`,
          },
        },
      },
      toAddress,
      toChain: "bas",
      toToken: chainConfig.tokenAddress,
    }),
    [toName, toAddress]
  );
  return <LiFiWidget integrator="daimo" config={widgetConfig} />;
}
