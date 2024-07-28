import { Alert, Linking } from "react-native";

import { i18n } from "../i18n";

const i18 = i18n.settingsModal;

// Ask to open settings to enable `type` access.
export async function askOpenSettings(
  type: "contacts" | "notifications" | "camera",
  resolve: (value: void) => void
) {
  const settingPhrase = i18.settingPhrase[type]();

  Alert.alert(i18.modalTitle(), i18.modalBody({ settingPhrase }), [
    {
      text: i18n.shared.buttonAction.continue(),
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
      text: i18n.shared.buttonAction.cancel(),
      style: "cancel",
      onPress: () => {
        resolve();
      },
    },
  ]);
}
