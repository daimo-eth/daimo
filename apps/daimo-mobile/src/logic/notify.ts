import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState } from "react-native";

import { Log } from "./log";
import { rpcFunc } from "./trpc";
import { getAccountManager, useAccount } from "../model/account";

/** Registers push notifications, if we have permission & haven't already. */
export function useInitNotifications() {
  const [account] = useAccount();
  const address = account?.address;

  useEffect(() => {
    if (address == null) return;

    // Register push token for account, if we haven't already
    getPushNotificationManager().maybeSavePushTokenForAccount();

    // Show notifications (but badge stays cleared) even when app is open
    Notifications.setNotificationHandler({
      handleNotification: async (n: Notifications.Notification) => {
        const { title, body } = n.request.content;
        console.log(`[NOTIFY] handling push ${title} - ${body}`);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

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

let pushNotitificationManager = null as null | PushNotificationManager;

export function getPushNotificationManager() {
  if (pushNotitificationManager == null) {
    pushNotitificationManager = new PushNotificationManager();
  }
  return pushNotitificationManager;
}

class PushNotificationManager {
  accountManager = getAccountManager();

  maybeSavePushTokenForAccount = async () => {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    if (this.accountManager.currentAccount == null) return;

    const token = await Notifications.getExpoPushTokenAsync();
    if (token.data === this.accountManager.currentAccount.pushToken) {
      console.log(`[NOTIFY] push token ${token} already saved`);
      return;
    }

    const { name } = this.accountManager.currentAccount;
    console.log(`[NOTIFY] saving push token ${token} for account ${name}`);
    const { address } = this.accountManager.currentAccount;
    await Log.promise(
      "registerPushToken",
      rpcFunc.registerPushToken.mutate({ address, token: token.data })
    );

    const acc = this.accountManager.currentAccount;
    this.accountManager.setCurrentAccount({ ...acc, pushToken: token.data });
  };
}
