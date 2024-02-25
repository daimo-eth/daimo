import { EmailAddress, PhoneNumber } from "@daimo/common";
import { Linking, Platform } from "react-native";
import { getEmailClients, openComposer } from "react-native-email-link";

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

export async function composeEmail(
  email: EmailAddress
): Promise<ComposeSend | undefined> {
  // Test if we can email first
  const emailClients = await getEmailClients();
  console.log(`[COMPOSE] emailClients ${JSON.stringify(emailClients)}`);
  if (emailClients.length === 0) return undefined;

  return async (sendParams: ComposeParams) => {
    const { url, senderName, dollars, recipientName } = sendParams;
    const dollarStr = `${dollars.toFixed(2)}`;
    const recipientStr = recipientName || email;
    const subject = `${senderName} sent you $${dollarStr}`;
    const body = `Hi ${recipientStr},\r\n\r\n${senderName} sent you $${dollarStr} USDC and invited you to join Daimo.\r\n\r\nVisit here to accept: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`;

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

export async function composeSMS(
  phoneNumber: PhoneNumber
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
    const { url, senderName, dollars } = sendParams;
    const dollarStr = `${dollars.toFixed(2)}`;

    const body = `${senderName} sent you $${dollarStr} USDC and invited you to join Daimo: ${url}`;

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
