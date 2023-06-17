import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Address } from "viem";

import { Log } from "./log";
import { rpcFunc } from "./trpc";
import { useAccount } from "../model/account";

export function notify(title: string, body: string) {
  console.log(`[NOTIFY] ${title} ${body}`);
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

/** Registers push notifications, if we have permission & haven't already. */
export function useInitNotifications() {
  const [account] = useAccount();
  const address = account?.address;

  useEffect(() => {
    if (address == null) return;

    // Always clear the badge when app loads
    Notifications.setBadgeCountAsync(0);

    // Show notifications (but badge stays cleared) even when app is open
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // TODO: re-request permissions if necessary, if we haven't asked recently
    // and an incoming payment just arrived
    maybeRegisterPushToken(address);
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
