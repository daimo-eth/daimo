import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

import { MsgContact } from "./daimoContacts";

export interface ContactsAccess {
  permission: Contacts.PermissionResponse | undefined;
  ask: () => void;
}

export function useContactsPermission(): ContactsAccess {
  const [contactsPermission, setContactsPermission] = useState<
    Contacts.PermissionResponse | undefined
  >();

  const fetchPermissions = async () => {
    await Contacts.getPermissionsAsync().then(setContactsPermission);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const ask = async () => {
    // Refresh permission state before prompting.
    const latestContactPermission = await Contacts.getPermissionsAsync();

    if (!latestContactPermission.granted) {
      await requestContactsAccess(latestContactPermission.canAskAgain);
    }

    fetchPermissions();
  };

  return { permission: contactsPermission, ask };
}

// Take user through a two-step flow to ask for contacts access.
// Promise resolves when user has finished the flow (either granting
// or denying).
function requestContactsAccess(canAskAgain: boolean) {
  // Step 1: Ask with our own prompt, re-assuring user.
  return new Promise<void>((resolve) => {
    Alert.alert(
      "Daimo Local Contacts",
      "Daimo would like to access your contacts to find and pay friends. Your contacts remain private and are never uploaded or shared.",
      [
        {
          text: `Continue`,
          onPress: () => {
            if (canAskAgain) askSystem(resolve);
            else askOpenSettings(resolve);
          },
        },
        {
          text: "Don't Allow",
          style: "cancel",
          onPress: () => {
            resolve();
          },
        },
      ]
    );
  });
}

function askSystem(resolve: (value: void) => void) {
  // Step 2: If user says yes to our own prompt, ask with the system prompt
  Contacts.requestPermissionsAsync().then(() => {
    resolve();
  });
}

async function askOpenSettings(resolve: (value: void) => void) {
  // Step 2: If user says yes to our own prompt but previously denied system
  // prompt, ask them to open settings.
  Alert.alert(
    "Enable access in Settings",
    "Visit Settings > Daimo and enable contacts.",
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
    ]
  );
}

export function useSystemContactsSearch(
  prefix: string,
  enabled: boolean
): MsgContact[] {
  const [recipients, setRecipients] = useState<MsgContact[]>([]);

  useEffect(() => {
    const search = async (nameSearchTerm: string) => {
      const { data } = await Contacts.getContactsAsync({
        // TODO: add images?
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        name: nameSearchTerm,
        pageSize: 5,
      });

      const matches = [] as MsgContact[];
      for (const contact of data) {
        const name = contact.name;
        if (name == null) continue;

        // Show at most one email and one phone number per contact.
        for (const phone of contact.phoneNumbers ?? []) {
          if (phone.number) {
            matches.push({
              type: "phoneNumber",
              phoneNumber: phone.number,
              name,
            });
            break;
          }
        }

        for (const email of contact.emails ?? []) {
          if (email.email) {
            matches.push({ type: "email", email: email.email, name });
            break;
          }
        }
      }

      setRecipients(matches);
    };

    if (enabled) search(prefix);
    else setRecipients([]);
  }, [prefix, enabled]);

  return recipients;
}
