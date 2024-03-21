import { EmailAddress, PhoneNumber } from "@daimo/common";
import { Linking, Platform } from "react-native";
import { getEmailClients, openComposer } from "react-native-email-link";

import { shareURL } from "./shareURL";
import { MsgContact } from "../../logic/daimoContacts";

type PaymentLinkComposeParams = {
  type: "paymentLink";
  url: string;
  senderName: string;
  dollars: number;
  recipientName?: string;
};

// TODO: In future, add invite link compose params
type ComposeParams = PaymentLinkComposeParams;

type ComposeSend = (sendParams: ComposeParams) => Promise<boolean>;

function generateEmail(
  email: EmailAddress,
  sendParams: ComposeParams,
  mode: "send" | "receive"
) {
  const { url, senderName, dollars, recipientName } = sendParams;
  const dollarStr = `${dollars.toFixed(2)}`;
  const recipientStr = recipientName || email;

  let subject: string;
  let body: string;

  if (mode === "send") {
    subject = `${senderName} sent you $${dollarStr}`;
    body = `Hi ${recipientStr},\r\n\r\n${senderName} sent you $${dollarStr} USDC and invited you to join Daimo.\r\n\r\nVisit here to accept: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`;
  } else {
    subject = `${senderName} requested $${dollarStr}`;
    body = `Hi ${recipientStr},\r\n\r\n${senderName} requested $${dollarStr} USDC on Daimo.\r\n\r\nVisit here to send: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`;
  }

  return { subject, body };
}

function generateSMS(sendParams: ComposeParams, mode: "send" | "receive") {
  const { url, senderName, dollars } = sendParams;
  const dollarStr = `${dollars.toFixed(2)}`;

  let body: string;
  if (mode === "send") {
    body = `${senderName} sent you $${dollarStr} USDC and invited you to join Daimo: ${url}`;
  } else {
    body = `${senderName} requested $${dollarStr} USDC on Daimo: ${url}`;
  }

  return body;
}

async function composeEmail(
  email: EmailAddress,
  mode: "send" | "receive"
): Promise<ComposeSend | undefined> {
  // Test if we can email first
  const emailClients = await getEmailClients();
  console.log(`[COMPOSE] emailClients ${JSON.stringify(emailClients)}`);
  if (emailClients.length === 0) return undefined;

  return async (sendParams: ComposeParams) => {
    const { subject, body } = generateEmail(email, sendParams, mode);

    // Open email client directly if there's only one
    const appId = emailClients.length === 1 ? emailClients[0].id : undefined;

    const appUsed = await openComposer({
      defaultEmailLabel: "Apple Mail", // Only used on iOS
      body,
      subject,
      to: email,
      app: appId,
      removeText: true,
    });
    console.log(`[COMPOSE] appUsed ${appUsed}`);

    return appUsed != null;
  };
}

async function composeSMS(
  phoneNumber: PhoneNumber,
  mode: "send" | "receive"
): Promise<ComposeSend | undefined> {
  // Test if we can SMS first
  const testOpenString =
    Platform.OS === "android"
      ? `sms:${phoneNumber}?body=test`
      : encodeURI(`sms:${phoneNumber}&body=test`);
  const canOpen = await Linking.canOpenURL(testOpenString);

  console.log(`[COMPOSE] testOpenString ${testOpenString}: ${canOpen}`);
  if (!canOpen) return undefined;

  return async (sendParams: ComposeParams) => {
    const body = generateSMS(sendParams, mode);

    const openString = (function () {
      if (Platform.OS === "android")
        return `sms:${phoneNumber}?body=${encodeURIComponent(body)}`;
      else return encodeURI(`sms:${phoneNumber}&body=${body}`);
    })();

    if (await Linking.canOpenURL(openString)) {
      await Linking.openURL(openString);
      return true;
    } else {
      return false;
    }
  };
}

export type ExternalAction = {
  type: "sms" | "mail" | "share";
  exec: (url: string, dollars: number) => Promise<boolean>;
};

export async function getSendRecvLinkAction(
  recipient: MsgContact,
  senderName: string,
  mode: "send" | "receive"
): Promise<ExternalAction> {
  const composer =
    recipient.type === "email"
      ? await composeEmail(recipient.email, mode)
      : await composeSMS(recipient.phoneNumber, mode);

  if (!composer) {
    return {
      type: "share",
      exec: shareURL,
    };
  } else {
    return {
      type: recipient.type === "email" ? "mail" : "sms",
      exec: async (url: string, dollars: number) => {
        return composer({
          type: "paymentLink",
          url,
          senderName,
          dollars,
        });
      },
    };
  }
}
