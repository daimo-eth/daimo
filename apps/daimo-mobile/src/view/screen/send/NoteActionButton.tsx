import {
  AddrLabel,
  DaimoLink,
  DaimoNoteState,
  EAccount,
  OpStatus,
  assertNotNull,
  dollarsToAmount,
  formatDaimoLink,
  generateNoteSeedAddress,
  getNoteId,
} from "@daimo/common";
import { notesV2AddressMap } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import {
  transferAccountTransform,
  useSendAsync,
} from "../../../action/useSendAsync";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { Account } from "../../../model/account";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig, LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { useNav } from "../../shared/nav";
import { TextError } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

export type ExternalAction = {
  type: "sms" | "mail" | "share";
  exec: (url: string, dollars: number) => Promise<boolean>;
};

/** Creates a Note. User picks amount, then sends link via SMS, mail or ShareSheet. */
export function NoteActionButton({
  dollars,
  externalAction,
}: {
  dollars: number;
  externalAction: ExternalAction;
}) {
  const Inner = useWithAccount(NoteActionButtonInner);
  return <Inner dollars={dollars} externalAction={externalAction} />;
}

function NoteActionButtonInner({
  account,
  dollars,
  externalAction,
}: {
  account: Account;
  dollars: number;
  externalAction: ExternalAction;
}) {
  const [[noteSeed, noteAddress]] = useState(generateNoteSeedAddress);
  const noteId = getNoteId(noteAddress);

  const [nonce] = useState(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.CreateNote))
  );

  const notesV2Addr = assertNotNull(notesV2AddressMap.get(account.homeChainId));

  const notesV2isApproved = account.recentTransfers.some(
    (op) => op.type === "createLink" && op.to === notesV2Addr
  );

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      return opSender.createEphemeralNote(
        noteAddress,
        `${dollars}`,
        !notesV2isApproved,
        {
          nonce,
          chainGasConstants: account.chainGasConstants,
        }
      );
    },
    pendingOp: {
      type: "createLink",
      status: OpStatus.pending,
      from: account.address,
      to: notesV2Addr,
      amount: Number(dollarsToAmount(dollars)),
      timestamp: Date.now() / 1e3,
      nonceMetadata: nonce.metadata.toHex(),
      noteStatus: {
        link: {
          type: "notev2",
          sender: account.name,
          dollars: `${dollars}`,
          id: noteId,
          seed: noteSeed,
        },
        status: DaimoNoteState.Pending,
        sender: { addr: account.address, name: account.name },
        dollars: `${dollars}`,
        contractAddress: notesV2Addr,
        ephemeralOwner: noteAddress,
        id: noteId,
      },
    },
    accountTransform: transferAccountTransform([
      {
        addr: notesV2Addr,
        label: AddrLabel.PaymentLink,
      } as EAccount,
    ]),
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
        return externalAction.type === "share" ? sendViaAppStr : null;
      default:
        return null;
    }
  })();

  const nav = useNav();

  const sendNote = useCallback(async () => {
    if (status !== "success") return;

    const link: DaimoLink = {
      type: "notev2",
      sender: account.name,
      dollars: `${dollars}`,
      id: noteId,
      seed: noteSeed,
    };
    const url = formatDaimoLink(link);

    const didShare = await externalAction.exec(url, dollars);
    console.log(`[SEND NOTE] external action executed: ${didShare}`);

    nav.reset({
      routes: [
        {
          name: "SendTab",
          params: { screen: "SendNav", params: {} },
        },
      ],
    });
    nav.navigate("HomeTab", { screen: "Home" });
  }, [status]);

  const externalActionButtonTitle = (function () {
    switch (externalAction.type) {
      case "sms":
        return "SEND SMS";
      case "mail":
        return "SEND MAIL";
      case "share":
        return "SEND PAYMENT LINK";
    }
  })();

  // As soon as payment link is created, trigger external action
  // TODO: move this to a dispatcher
  useEffect(() => {
    if (status !== "success") return;
    sendNote();
  }, [status]);

  const button = (function () {
    switch (status) {
      case "idle":
      case "error":
        return (
          <LongPressBigButton
            type="primary"
            title="HOLD TO CONFIRM"
            onPress={exec}
            disabled={sendDisabled}
            duration={400}
            showBiometricIcon
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return (
          <ButtonBig
            type="success"
            title={externalActionButtonTitle}
            onPress={sendNote}
          />
        );
    }
  })();

  return <ButtonWithStatus button={button} status={statusMessage} />;
}
