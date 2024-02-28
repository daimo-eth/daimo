import { getInitialURL } from "expo-linking";

// If an initialURL previously triggered app launch in onboarding state,
// we don't want to trigger it again.
let hasHandledInitialInOnboarding = false;

// User opened app via deeplink or scanning an NFC tag: return URL, otherwise null.
// Currently, tags are disabled in the app, we only use universal deeplinks.
export async function getInitialURLOrTag(isOnboarding: boolean) {
  if (hasHandledInitialInOnboarding && !isOnboarding) return null;
  if (isOnboarding) hasHandledInitialInOnboarding = true;

  const deeplinkURL = await getInitialURL();
  if (deeplinkURL) {
    return deeplinkURL;
  }

  return null;
}
