import { EmailAddress, PhoneNumber } from "@daimo/common";
import { Linking, Platform } from "react-native";

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
  const testOpenString =
    Platform.OS === "android"
      ? `mailto:${email}`
      : encodeURI(`mailto:${email}`);

  const canOpen = await Linking.canOpenURL(testOpenString);
  console.log(`[COMPOSE] testOpenString ${testOpenString}: ${canOpen}`);
  if (!canOpen) return undefined;

  return async (sendParams: ComposeParams) => {
    const { url, senderName, dollars, recipientName } = sendParams;
    const dollarStr = `${dollars.toFixed(2)}`;
    const recipientStr = recipientName || email;
    const subject = `${senderName} sent you $${dollarStr}`;
    const body = `Hi ${recipientStr},\r\n\r\n${senderName} sent you $${dollarStr} USDC and invited you to join Daimo.\r\n\r\nVisit here to accept: ${url}\r\n\r\nDaimo is a global payments app that lets you send and receive USDC on Ethereum.`;

    const openString = (function () {
      if (Platform.OS === "android")
        return `mailto:${email}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;
      else return encodeURI(`mailto:${email}?subject=${subject}&body=${body}`);
    })();

    if (await Linking.canOpenURL(openString)) {
      await Linking.openURL(openString);
      return true;
    } else {
      return false;
    }
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
