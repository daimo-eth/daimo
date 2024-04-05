import { DaimoLink, formatDaimoLink } from "@daimo/common";
import { Alert, Linking, Platform, Share, ShareAction } from "react-native";
import { getEmailClients, openComposer } from "react-native-email-link";

import {
  EmailContact,
  MsgContact,
  PhoneNumberContact,
  getContactName,
} from "./daimoContacts";

type ComposeSend = (link: DaimoLink) => Promise<boolean>;

function generateEmailCopy(link: DaimoLink, to: EmailContact) {
  const contactName = getContactName(to);

  switch (link.type) {
    case "notev2": {
      const { sender: senderName, dollars } = link;
      const url = formatDaimoLink(link);

      return {
        subject: `${senderName} sent you $${dollars}`,
        body: `Hi ${contactName},\r\n\r\n${senderName} sent you $${dollars} USDC and invited you to join Daimo.\r\n\r\nVisit here to accept: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`,
      };
    }
    case "requestv2": {
      const { recipient, dollars } = link;
      const url = formatDaimoLink(link);

      return {
        subject: `${recipient} is requesting $${dollars}`,
        body: `Hi ${contactName},\r\n\r\n${recipient} requested $${dollars} USDC on Daimo.\r\n\r\nVisit here to send: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`,
      };
    }
    default: {
      throw new Error("Unknown link type");
    }
  }
}

function generateSMSCopy(link: DaimoLink) {
  switch (link.type) {
    case "notev2": {
      const { sender: senderName, dollars } = link;
      const url = formatDaimoLink(link);

      return `${senderName} sent you $${dollars} USDC and invited you to join Daimo: ${url}`;
    }
    case "requestv2": {
      const { recipient, dollars } = link;
      const url = formatDaimoLink(link);

      return `${recipient} is requesting $${dollars} USDC on Daimo: ${url}`;
    }
    default: {
      throw new Error("Unknown link type");
    }
  }
}

async function composeEmail(
  to: EmailContact
): Promise<ComposeSend | undefined> {
  // Test if we can email first
  const emailClients = await getEmailClients();
  console.log(`[EXTACTION] emailClients ${JSON.stringify(emailClients)}`);
  if (emailClients.length === 0) return undefined;

  return async (link: DaimoLink) => {
    const { subject, body } = generateEmailCopy(link, to);

    // Open email client directly if there's only one
    const appId = emailClients.length === 1 ? emailClients[0].id : undefined;

    const appUsed = await openComposer({
      defaultEmailLabel: "Apple Mail", // Only used on iOS
      body,
      subject,
      to: to.email,
      app: appId,
      removeText: true,
    });
    console.log(`[EXTACTION] appUsed ${appUsed}`);

    return appUsed != null;
  };
}

async function composeSMS(
  to: PhoneNumberContact
): Promise<ComposeSend | undefined> {
  // Test if we can SMS first
  const testOpenString =
    Platform.OS === "android"
      ? `sms:${to.phoneNumber}?body=test`
      : encodeURI(`sms:${to.phoneNumber}&body=test`);
  const canOpen = await Linking.canOpenURL(testOpenString);

  console.log(`[EXTACTION] testOpenString ${testOpenString}: ${canOpen}`);
  if (!canOpen) return undefined;

  return async (link: DaimoLink) => {
    const body = generateSMSCopy(link);

    const openString = (function () {
      if (Platform.OS === "android")
        return `sms:${to.phoneNumber}?body=${encodeURIComponent(body)}`;
      else return encodeURI(`sms:${to.phoneNumber}&body=${body}`);
    })();

    if (await Linking.canOpenURL(openString)) {
      await Linking.openURL(openString);
      return true;
    } else {
      return false;
    }
  };
}

// Share via system share sheet = user picks messaging app
// Used as fallback, or with plain links directly.
export async function shareURL(link: DaimoLink): Promise<boolean> {
  try {
    const url = formatDaimoLink(link);
    let result: ShareAction;
    if (Platform.OS === "android") {
      result = await Share.share({ message: url });
    } else {
      result = await Share.share({ url }); // Default behavior for iOS
    }

    console.log(`[EXTACTION] action ${result.action}`);
    if (result.action === Share.sharedAction) {
      console.log(`[EXTACTION] shared, activityType: ${result.activityType}`);
      return true;
    } else if (result.action === Share.dismissedAction) {
      console.log(`[EXTACTION] share dismissed`); // Only on iOS
    }
  } catch (error: any) {
    Alert.alert(error.message);
  }
  return false;
}

// An external action is ways to send links outside the app, currently we support
// email, SMS and plain share sheet.
export type ExternalAction = {
  type: "phoneNumber" | "email" | "share";
  exec: (link: DaimoLink) => Promise<boolean>;
};

// Get an external action to compose an email or SMS, with a fallback to the
// share sheet in case composing is unavailable for whatever reason.
export async function getComposeExternalAction(
  to: MsgContact
): Promise<ExternalAction> {
  const composer =
    to.type === "email" ? await composeEmail(to) : await composeSMS(to);

  if (!composer) {
    return {
      type: "share",
      exec: shareURL,
    };
  } else {
    return {
      type: to.type,
      exec: composer,
    };
  }
}
