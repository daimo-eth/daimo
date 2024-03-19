import { getInitialURL } from "expo-linking";

// If a deeplink was already handled, don't handle it again.
let alreadyHandled = false;

// User opened app via deeplink or scanning an NFC tag: return URL, otherwise null.
// Currently, tags are disabled in the app, we only use universal deeplinks.
export async function getInitialDeepLink() {
  if (alreadyHandled) return null;
  const deeplinkURL = await getInitialURL();
  return deeplinkURL;
}

export async function markInitialDeepLinkHandled() {
  alreadyHandled = true;
}
