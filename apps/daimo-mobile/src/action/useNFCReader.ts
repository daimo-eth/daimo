import { parseDaimoLink } from "@daimo/common";
import { useEffect } from "react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { Hex, hexToBytes } from "viem";

import { handleDeepLink, useNav } from "../view/shared/nav";

let isReadingNfc = false;

export function useNFCReader() {
  const nav = useNav();
  useEffect(() => {
    console.log("[NFC] init");
    initNFC(nav);
  }, []);
}

async function initNFC(nav: ReturnType<typeof useNav>) {
  await NfcManager.start();
  const isEnabled = await NfcManager.isEnabled();
  const isSupported = await NfcManager.isSupported();
  console.log(`[NFC] isEnabled: ${isEnabled}, isSupported: ${isSupported}`);
  if (!isEnabled || !isSupported) return;

  setInterval(() => {
    if (isReadingNfc) return;
    readNdef(nav);
  }, 1000);
  readNdef(nav);
}

async function readNdef(nav: ReturnType<typeof useNav>) {
  try {
    // register for the NFC tag with NDEF in it
    isReadingNfc = true;
    console.log(`[NFC] looking for an NFC tag`);
    try {
      const tech = await NfcManager.requestTechnology(NfcTech.IsoDep);
      console.log("[NFC] requestTechnology result", tech);
    } catch (e) {
      console.warn("[NFC] requestTechnology error", e);
    }

    // the resolved tag object will contain `ndefMessage` property
    const tag = await NfcManager.getTag();
    console.log(`[NFC] tag event`, tag);

    // This sends the SELECT command for the Daimo POS App AID
    const resp1 = await transceiveString("0x00a4040007d276000085010100");
    console.log(`[NFC] reading card: ` + resp1);

    // This sends the custom data-transceive command, it returns the Daimo link
    const realResp = await transceiveString("0x00ca9a2b00");
    const daimoLink = parseDaimoLink(realResp);
    if (daimoLink == null) {
      console.warn(`[NFC] ignoring invalid daimo link: `, realResp);
      return;
    }

    console.warn(`[NFC] got link: `, realResp);
    handleDeepLink(nav, realResp);
    await NfcManager.cancelTechnologyRequest();
    isReadingNfc = false;
  } catch (ex) {
    console.warn("[NFC] error ", ex);
    await NfcManager.cancelTechnologyRequest();
    isReadingNfc = false;
  }
}

async function transceiveString(hexInput: Hex): Promise<string> {
  const bytesIn = Array.from(hexToBytes(hexInput));
  const bytesOut = await NfcManager.isoDepHandler.transceive(bytesIn);
  return String.fromCharCode.apply(null, bytesOut);
}
