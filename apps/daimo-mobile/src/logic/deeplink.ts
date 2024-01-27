import { getInitialURL } from "expo-linking";
import { Platform } from "react-native";
import NfcManager, { Ndef, NdefRecord } from "react-native-nfc-manager";

// If an initialURL previously triggered app launch in onboarding state,
// we don't want to trigger it again.
let hasHandledInitialInOnboarding = false;

// User opened app via deeplink or scanning an NFC tag: return URL, otherwise null.
export async function getInitialURLOrTag(isOnboarding: boolean) {
  if (hasHandledInitialInOnboarding && !isOnboarding) return null;
  if (isOnboarding) hasHandledInitialInOnboarding = true;

  const deeplinkURL = await getInitialURL();
  if (deeplinkURL) {
    return deeplinkURL;
  }

  if (Platform.OS === "android") {
    const tag = await NfcManager.getLaunchTagEvent();
    if (tag && tag.ndefMessage.length > 0) {
      console.log(`[DEEPLINK] got NFC tag ${JSON.stringify(tag)}`);
      try {
        const message = tag.ndefMessage[0];
        if (isRecordUint8Array(message.payload) && isURIRecord(message)) {
          const nfcURL = Ndef.uri.decodePayload(message.payload);
          console.log(`[DEEPLINK] decoded NFC tag payload: ${nfcURL}`);
          return nfcURL;
        } else {
          console.warn(`[DEEPLINK] NFC tag payload is not a well-formed URI`);
        }
      } catch (e) {
        console.warn(
          `[DEEPLINK] error decoding NFC tag payload, failing silently: ${e}`
        );
      }
    }
  }

  return null;
}

function isURIRecord(record: NdefRecord) {
  return Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI);
}

function isRecordUint8Array(payload: unknown): payload is Uint8Array {
  return true;
}
