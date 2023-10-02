import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../view/shared/nav";
import { Recipient, getRecipient } from "../sync/recipients";

NfcManager.start();


async function readNdef(nav: NativeStackNavigationProp<HomeStackParamList>) {
    try {
      // register for the NFC tag with NDEF in it
      try {
        await NfcManager.requestTechnology(NfcTech.IsoDep);
      } catch (ex) {
      }
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      var tesp = await NfcManager.isoDepHandler.transceive([0x00, 0xA4, 0x04, 0x00, 0x07, 0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01, 0x00]);
  
      const realResp = await NfcManager.isoDepHandler.transceive([0x00, 0xCA, 0x9A, 0x2B, 0x00]);
  
      const utf8String = String.fromCharCode.apply(null, realResp);
  
      await intepretInput(utf8String, nav);

      NfcManager.cancelTechnologyRequest();

      await sleep(2000)

      readNdef(nav);
    } catch (ex) {
      console.warn('Oops!', ex);
      NfcManager.cancelTechnologyRequest();
      await sleep(2000)
      readNdef(nav);
    }    
}

async function intepretInput(jsonStr: string, nav: NativeStackNavigationProp<HomeStackParamList>) {
    var inputObj = JSON.parse(jsonStr);

    const recipient = await getRecipient(inputObj.recipient);
    const dollars = parseFloat(inputObj.amount);
    nav.navigate("Send", { recipient, dollars, requestId: generateRequestID() });
}

function generateRequestID() {
  const hexRandomString = generatePrivateKey().slice(
    0,
    2 + Number(MAX_NONCE_ID_SIZE_BITS / 4n) // One hex is 4 bits
  ) as Hex; // Uses secure random.
  return `${BigInt(hexRandomString)}` as `${bigint}`;
}

function sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function useInitNFC() {
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    useEffect(() => {
        readNdef(nav);
    }, []);
}
