import {
  AddrLabel,
  DaimoLink,
  EAccount,
  OpStatus,
  dollarsToAmount,
  formatDaimoLink,
} from "@daimo/common";
import { daimoEphemeralNotesAddress } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Share, ShareAction } from "react-native";
import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { useSendAsync } from "../../../action/useSendAsync";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { Account } from "../../../model/account";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { useNav } from "../../shared/nav";
import { TextError } from "../../shared/text";
import { withAccount } from "../../shared/withAccount";

/** Creates a Note. User picks amount, then sends message via ShareSheet. */
export function SendNoteButton({ dollars }: { dollars: number }) {
  const Inner = withAccount(SendNoteButtonInner);
  return <Inner dollars={dollars} />;
}

function SendNoteButtonInner({
  account,
  dollars,
}: {
  account: Account;
  dollars: number;
}) {
  const [ephemeralPrivKey] = useState<Hex>(generatePrivateKey);
  const ephemeralOwner = useMemo(
    () => privateKeyToAccount(ephemeralPrivKey).address,
    [ephemeralPrivKey]
  );

  const [nonce] = useState(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.CreateNote))
  );

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      return opSender.createEphemeralNote(ephemeralOwner, `${dollars}`, {
        nonce,
        chainGasConstants: account.chainGasConstants,
      });
    },
    pendingOp: {
      type: "transfer",
      status: OpStatus.pending,
      from: account.address,
      to: daimoEphemeralNotesAddress,
      amount: Number(dollarsToAmount(dollars)),
      timestamp: Date.now() / 1e3,
      nonceMetadata: nonce.metadata.toHex(),
    },
    accountTransform: (account, pendingOp) => ({
      ...account,
      pendingNotes: [
        ...account.pendingNotes,
        {
          type: "note",
          ephemeralOwner,
          ephemeralPrivateKey: ephemeralPrivKey,
          previewDollars: `${dollars}`,
          previewSender: account.name,
          opHash: pendingOp.opHash,
        },
      ],
    }),
    namedAccounts: [
      {
        addr: daimoEphemeralNotesAddress,
        label: AddrLabel.PaymentLink,
      } as EAccount,
    ],
  });

  const sendDisabledReason =
    account.lastBalance < dollarsToAmount(cost.totalDollars)
      ? "Insufficient funds"
      : undefined;
  const sendDisabled = sendDisabledReason != null || dollars === 0;

  const [, sendViaAppStr] = useAvailMessagingApps();

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (sendDisabledReason != null) {
          return <TextError>{sendDisabledReason}</TextError>;
        }
        return `Total incl. fees ${getAmountText({
          dollars: cost.totalDollars,
        })}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      case "success":
        return sendViaAppStr;
      default:
        return null;
    }
  })();

  const nav = useNav();

  const sendNote = useCallback(async () => {
    if (status !== "success") return;

    try {
      const link: DaimoLink = {
        type: "note",
        previewSender: account.name,
        previewDollars: `${dollars}`,
        ephemeralOwner,
        ephemeralPrivateKey: ephemeralPrivKey,
      };
      const url = formatDaimoLink(link);

      let result: ShareAction;
      if (Platform.OS === "android") {
        result = await Share.share({ message: url });
      } else {
        result = await Share.share({ url }); // Default behavior for iOS
      }

      if (result.action === Share.sharedAction) {
        console.log(
          "[APP] Note shared with activity type ",
          result.activityType || "unknown"
        );
        nav.navigate("HomeTab", { screen: "Home" });
      } else if (result.action === Share.dismissedAction) {
        // Only on iOS
        console.log("[APP] Note share reverted");
        // TODO: Suggest revert or retry?
      }
    } catch (error: any) {
      console.error("[APP] Note share error:", error);
    }
  }, [ephemeralOwner, ephemeralPrivKey, status]);

  // As soon as payment link is created, show share sheet
  // TODO: move this to a dispatcher
  useEffect(() => {
    if (status !== "success") return;
    sendNote();
  }, [status]);

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            type="primary"
            title="CREATE PAYMENT LINK"
            onPress={exec}
            disabled={sendDisabled}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return (
          <ButtonBig
            type="success"
            title="Send Payment Link"
            onPress={sendNote}
          />
        );
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
