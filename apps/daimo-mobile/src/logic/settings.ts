import { Alert, Linking } from "react-native";

// Ask to open settings to enable `type` access.
export async function askOpenSettings(
  type: "contacts" | "notifications" | "camera",
  resolve: (value: void) => void,
) {
  Alert.alert(
    "Enable access in Settings",
    `Visit Settings > Daimo and enable ${type}.`,
    [
      {
        text: "Continue",
        onPress: () => {
          Linking.openSettings().then(async () => {
            // On iOS, the app is reset by the OS when access is changed from
            // settings, so this isn't triggered. On Android, we wait a
            // few seconds to let user open settings, then resolve.
            await new Promise((f) => setTimeout(f, 5000));
            resolve();
          });
        },
      },
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          resolve();
        },
      },
    ],
  );
}
