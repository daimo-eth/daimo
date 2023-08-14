import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { Log } from "./log";
import { rpcFunc } from "./trpc";
import { getAccountManager, useAccount } from "../model/account";
import { syncAfterPushNotification } from "../sync/sync";
import { FirebaseOptions, initializeApp } from 'firebase/app'
import googleServicesConfig from '../../google-services.json'

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
    try {
      if (Platform.OS === "android") {
        // Android specific setup
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        const firebaseConfig = {
          apiKey: googleServicesConfig.client[0].api_key[0].current_key,
          authDomain: googleServicesConfig.project_info.project_id + ".firebaseapp.com",
          projectId: googleServicesConfig.project_info.project_id,
          storageBucket: googleServicesConfig.project_info.storage_bucket,
          messagingSenderId: googleServicesConfig.project_info.project_number,
          appId: googleServicesConfig.client[0].client_info.mobilesdk_app_id,
        };

        console.log('Firebase config:', firebaseConfig)
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        console.log('Firebase initialized:', app.name);
      }
      await this.savePushTokenForAccount();
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
    if (this.accountManager.currentAccount == null) {
      throw new Error("No account");
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "1eff7c6e-e88b-4e35-8b31-eab7e6814904",
    });
    if (token.data === this.accountManager.currentAccount.pushToken) {
      console.log(`[NOTIFY] push token ${token.data} already saved`);
      return;
    }

    const { address, name } = this.accountManager.currentAccount;
    console.log(`[NOTIFY] saving push token ${token.data} for account ${name}`);
    await Log.promise(
      "registerPushToken",
      rpcFunc.registerPushToken.mutate({ address, token: token.data })
    );

    const acc = this.accountManager.currentAccount;
    this.accountManager.setCurrentAccount({ ...acc, pushToken: token.data });
  };
}
