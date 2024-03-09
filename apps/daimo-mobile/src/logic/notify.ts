import { daimoChainFromId } from "@daimo/contract";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Alert, AppState, Platform } from "react-native";

import { env } from "./env";
import { Log } from "./log";
import { askOpenSettings } from "./settings";
import { getAccountManager, useAccount } from "../model/account";
import { syncAfterPushNotification } from "../sync/sync";

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
        syncAfterPushNotification();
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    // Always clear the badge when app foregrounds
    Notifications.setBadgeCountAsync(0);
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      console.log("[NOTIFY] app in foreground, clearing badge");
      const count = await Notifications.getBadgeCountAsync();
      if (count > 0) {
        console.log("[NOTIFY] app opened with badge, syncing");
        syncAfterPushNotification();
      }
      await Notifications.setBadgeCountAsync(0);
    });
    return () => sub.remove();
  }, [address]);
}

let pushNotificationManager = null as null | PushNotificationManager;

export function getPushNotificationManager() {
  if (pushNotificationManager == null) {
    pushNotificationManager = new PushNotificationManager();
  }
  return pushNotificationManager;
}

class PushNotificationManager {
  accountManager = getAccountManager();

  maybeSavePushTokenForAccount = async () => {
    try {
      if (Platform.OS === "android") {
        // Android specific setup
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
      if (this.accountManager.currentAccount == null) {
        console.log("[NOTIFY] no account, skipping savePushToken");
        return;
      }

      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) {
        console.log("[NOTIFY] permission denied, skipping savePushToken");
        return;
      }

      await this.savePushTokenInner();
    } catch (e) {
      console.error(`[NOTIFY] failed to save push token`, e);
    }
  };

  savePushTokenForAccount = async () => {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        "Notifications pemission denied. You can change this in Settings."
      );
    }
    await this.savePushTokenInner();
  };

  private async savePushTokenInner() {
    if (this.accountManager.currentAccount == null) {
      throw new Error("No account");
    }

    // TODO: environment variable
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "1eff7c6e-e88b-4e35-8b31-eab7e6814904",
    });
    if (token.data === this.accountManager.currentAccount.pushToken) {
      console.log(`[NOTIFY] push token ${token.data} already saved`);
      return;
    }

    const { address, name, homeChainId } = this.accountManager.currentAccount;
    const rpcFunc = env(daimoChainFromId(homeChainId)).rpcFunc;
    console.log(`[NOTIFY] saving push token ${token.data} for account ${name}`);
    await Log.promise(
      "registerPushToken",
      rpcFunc.registerPushToken.mutate({ address, token: token.data })
    );

    const acc = this.accountManager.currentAccount;
    this.accountManager.setCurrentAccount({ ...acc, pushToken: token.data });
  }
}

interface NotificationsAccess {
  permission: Notifications.PermissionResponse | undefined;
  ask: () => Promise<void>;
}

export function useNotificationsAccess(): NotificationsAccess {
  const [permission, setPermission] = useState<
    Notifications.PermissionResponse | undefined
  >();

  const fetchPermissions = async () => {
    await Notifications.getPermissionsAsync().then(setPermission);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const ask = async () => {
    // Refresh permission state before prompting.
    const latestPermission = await Notifications.getPermissionsAsync();

    if (!latestPermission.granted) {
      await requestNotificationsAccess(latestPermission.canAskAgain);
    }

    fetchPermissions();
  };

  return { permission, ask };
}

async function requestNotificationsAccess(canAskAgain: boolean) {
  if (!Device.isDevice) {
    console.log(`[NOTIFY] not on a real device, skipping notification request`);
    Alert.alert(
      "Push notifications not supported in simulator",
      undefined,
      [
        {
          text: `Continue`,
        },
      ],
      { cancelable: false }
    );
    return;
  }

  if (canAskAgain) await Notifications.requestPermissionsAsync();
  else {
    await askOpenSettings("notifications", () => {});
  }
}
