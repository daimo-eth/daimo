import * as Notifications from "expo-notifications";

export function initNotify() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function notify(title: string, body: string) {
  console.log(`[NOTIFY] ${title} ${body}`);
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
