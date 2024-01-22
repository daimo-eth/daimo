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

const encodingFunction = Platform.OS === "ios" ? encodeURI : encodeURIComponent;
const smsDivider = Platform.OS === "ios" ? "&" : "?";

export async function composeEmail(
  email: EmailAddress
): Promise<ComposeSend | undefined> {
  // Test if we can email first
  const testOpenString = encodingFunction(`mailto:${email}`);
  console.log(`[COMPOSE] testOpenString ${testOpenString}`);
  if (!(await Linking.canOpenURL(testOpenString))) return undefined;

  return async (sendParams: ComposeParams) => {
    const { url, senderName, dollars, recipientName } = sendParams;
    const dollarStr = `${dollars.toFixed(2)}`;
    const recipientStr = recipientName || email;
    const subject = `${senderName} sent you $${dollarStr}`;
    const body = `Hi ${recipientStr},

${senderName} sent you $${dollarStr} USDC and invited you to join Daimo.

Visit here to accept: ${url}

Daimo is a global payments app that lets you send and receive USDC on Ethereum.`;

    const openString = encodingFunction(
      `mailto:${email}?subject=${subject}&body=${body}`
    );

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
  const testOpenString = encodingFunction(
    `sms:${phoneNumber}${smsDivider}body=test`
  );
  console.log(`[COMPOSE] testOpenString ${testOpenString}`);
  if (!(await Linking.canOpenURL(testOpenString))) return undefined;

  return async (sendParams: ComposeParams) => {
    const { url, senderName, dollars } = sendParams;
    const dollarStr = `${dollars.toFixed(2)}`;

    const body = `${senderName} sent you $${dollarStr} USDC and invited you to join Daimo. Visit here to accept: ${url}`;

    const openString = encodingFunction(
      `sms:${phoneNumber}${smsDivider}body=${body}`
    );

    if (await Linking.canOpenURL(openString)) {
      await Linking.openURL(openString);
      return true;
    } else {
      return false;
    }
  };
}
