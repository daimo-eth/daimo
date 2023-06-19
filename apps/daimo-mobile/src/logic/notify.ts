import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState } from "react-native";
import { Address } from "viem";

import { Log } from "./log";
import { rpcFunc } from "./trpc";
import { useAccount } from "../model/account";

/** Registers push notifications, if we have permission & haven't already. */
export function useInitNotifications() {
  const [account] = useAccount();
  const address = account?.address;

  useEffect(() => {
    if (address == null) return;

    // Show notifications (but badge stays cleared) even when app is open
    Notifications.setNotificationHandler({
      handleNotification: async (n: Notifications.Notification) => {
        const { title, body } = n.request.content;
        console.log(`[NOTIFY] handling push ${title} - ${body}`);
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });

    // TODO: re-request permissions if necessary, if we haven't asked recently
    // and an incoming payment just arrived
    maybeRegisterPushToken(address);

    // Always clear the badge when app foregrounds
    Notifications.setBadgeCountAsync(0);
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      console.log("[NOTIFY] app in foreground, clearing badge");
      Notifications.setBadgeCountAsync(0);
    });
    return () => sub.remove();
  }, [address]);
}

async function maybeRegisterPushToken(address: Address) {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  const token = await Log.promise(
    "getExpoPushTokenAsync",
    Notifications.getExpoPushTokenAsync()
  );

  await Log.promise(
    "registerPushToken",
    rpcFunc.registerPushToken.mutate({ address, token: token.data })
  );
}
