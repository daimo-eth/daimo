import { assertNotNull } from "@daimo/common";
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

// Sending Notes carries a risk if the note is revealed to a third party.
// Only suggest reasonably secure messaging apps, not email or SMS.
type MessagingApp = "WhatsApp" | "Telegram" | "Signal" | "iMessage";

let promise: Promise<MessagingApp[]> | null = null;

export function useAvailMessagingApps() {
  if (promise == null) {
    promise = getAvailMessagingApps();
  }

  const [availApps, setAvailApps] = useState<MessagingApp[]>();
  useEffect(() => {
    assertNotNull(promise).then(setAvailApps).catch(console.error);
  }, []);

  const sendViaAppStr = availApps == null ? null : getSendStr(availApps);

  return [availApps, sendViaAppStr] as const;
}

async function getAvailMessagingApps(): Promise<MessagingApp[]> {
  const results = await Promise.all([
    Linking.canOpenURL("whatsapp://send?text=Hello"),
    Linking.canOpenURL("sgnl://send?text=Hello"),
    Linking.canOpenURL("tg://send?text=Hello"),
  ]);
  const ret: MessagingApp[] = [];
  if (results[0]) ret.push("WhatsApp");
  if (results[1]) ret.push("Signal");
  if (Platform.OS === "ios") ret.push("iMessage");
  if (results[2]) ret.push("Telegram");
  return ret;
}

// Returns eg "Send via WhatsApp, Telegram, or Signal" or "Send via messaging app" if no preferred apps are available.
function getSendStr(availApps: MessagingApp[]) {
  const apps = availApps.slice(0, 3); // Only suggest top 3
  if (apps.length === 0) return `Send via messaging app`;
  if (apps.length === 1) return `Send via ${apps[0]}`;
  if (apps.length === 2) return `Send via ${apps[0]} or ${apps[1]}`;
  return `Send via ${apps[0]}, ${apps[1]}, or ${apps[2]}`;
}
