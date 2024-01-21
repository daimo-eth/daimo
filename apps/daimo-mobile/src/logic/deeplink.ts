import { getInitialURL } from "expo-linking";
import { Platform } from "react-native";
import NfcManager, { Ndef } from "react-native-nfc-manager";

export async function getInitialURLOrTag() {
  const url = await getInitialURL();
  if (url) return url;

  if (Platform.OS === "android") {
    const tag = await NfcManager.getLaunchTagEvent();
    if (tag && tag.ndefMessage.length > 0) {
      console.log(`[DEEPLINK] got NFC tag ${JSON.stringify(tag)}`);
      try {
        const message = tag.ndefMessage[0];
        const url = Ndef.uri.decodePayload(
          message.payload as unknown as Uint8Array
        );
        console.log(`[DEEPLINK] decoded NFC tag payload: ${url}`);
        return url;
      } catch (e) {
        console.warn(
          `[DEEPLINK] error decoding NFC tag payload, failing silently: ${e}`
        );
      }
    }
  }

  return null;
}
