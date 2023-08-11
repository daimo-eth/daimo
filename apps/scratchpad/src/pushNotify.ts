import { Expo } from "expo-server-sdk";

export function pushNotifyDesc() {
  return "Send a test push notification to given Expo Push Token";
}

export async function pushNotify() {
  const input = process.argv[3];
  if (!input) throw new Error("Usage: push-notify <name or address>");

  const expo = new Expo();
  const pushTokens = input.split(",");
  const title = "Test Notification";
  const body = "This is a test of the Daimo broadcast system";

  expo.sendPushNotificationsAsync([
    {
      to: pushTokens,
      badge: 1,
      title,
      body,
    },
  ]);
}
