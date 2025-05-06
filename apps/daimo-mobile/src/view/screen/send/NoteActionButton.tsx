import {
  AddrLabel,
  Clog,
  DaimoLink,
  DaimoNoteState,
  MoneyEntry,
  OpStatus,
  assertNotNull,
  dollarsToAmount,
  generateNoteSeedAddress,
  getFullMemo,
  getNoteId,
  now,
} from "@daimo/common";
import { notesV2AddressMap } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";

import {
  transferAccountTransform,
  useSendWithDeviceKeyAsync,
} from "../../../action/useSendAsync";
import { useNav } from "../../../common/nav";
import { i18n } from "../../../i18n";
import { ExternalAction } from "../../../logic/externalAction";
import { useAvailMessagingApps } from "../../../logic/messagingApps";
import { Account } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig, LongPressBigButton } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import { TextError } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

const i18 = i18n.noteAction;

/** Creates a Note. User picks amount, then sends link via SMS, mail or ShareSheet. */
export function NoteActionButton({
  money,
  memo,
  externalAction,
}: {
  money: MoneyEntry;
  memo?: string;
  externalAction: ExternalAction;
}) {
  const Inner = useWithAccount(NoteActionButtonInner);
  return <Inner {...{ money, memo, externalAction }} />;
}

function NoteActionButtonInner({
  account,
  money,
  memo,
  externalAction,
}: {
  account: Account;
  money: MoneyEntry;
  memo?: string;
  externalAction: ExternalAction;
}) {
  const [[noteSeed, noteAddress]] = useState(generateNoteSeedAddress);
  const noteId = getNoteId(noteAddress);

  const [nonce] = useState(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.CreateNote))
  );

  // Check if we need to approve() first
  const notesV2Addr = assertNotNull(notesV2AddressMap.get(account.homeChainId));
  const notesV2isApproved = account.recentTransfers.some(
    (op) => op.type === "createLink" && op.to === notesV2Addr
  );

  // Get the dollar amount + the memo
  const { dollars } = money;
  const fullMemo = getFullMemo({ memo, money });

  const link: DaimoLink = {
    type: "notev2",
    sender: account.name,
    dollars: `${dollars}`,
    id: noteId,
    seed: noteSeed,
  };

  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
    dollarsToSend: dollars,
    sendFn: async (opSender: DaimoOpSender) => {
      return opSender.createEphemeralNote(
        noteAddress,
        `${dollars}`,
        !notesV2isApproved,
        {
          nonce,
          chainGasConstants: account.chainGasConstants,
        },
        fullMemo
      );
    },
    pendingOp: {
      type: "createLink",
      status: OpStatus.pending,
      from: account.address,
      to: notesV2Addr,
      amount: Number(dollarsToAmount(dollars)),
      timestamp: now(),
      nonceMetadata: nonce.metadata.toHex(),
      noteStatus: {
        link,
        status: DaimoNoteState.Pending,
        sender: { addr: account.address, name: account.name },
        dollars: `${dollars}`,
        contractAddress: notesV2Addr,
        ephemeralOwner: noteAddress,
        id: noteId,
        memo: fullMemo,
      },
    },
    accountTransform: (account: Account, pendingOp: Clog) => {
      const notesAcc = { addr: notesV2Addr, label: AddrLabel.PaymentLink };
      return {
        ...transferAccountTransform([notesAcc])(account, pendingOp),
        sentPaymentLinks: [...account.sentPaymentLinks, link],
      };
    },
  });

  const sendDisabledReason =
    account.lastBalance < dollarsToAmount(cost.totalDollars)
      ? i18.disabledReason.insufficientFunds()
      : undefined;
  const sendDisabled = sendDisabledReason != null || dollars === 0;

  const [, sendViaAppStr] = useAvailMessagingApps();

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (sendDisabledReason != null) {
          return <TextError>{sendDisabledReason}</TextError>;
        }
        return i18.statusMsg.totalDollars(
          getAmountText({
            dollars: cost.totalDollars,
          })
        );
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

  const sendNote = async () => {
    if (status !== "success") return;

    const didShare = await externalAction.exec(link);
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
  };

  const externalActionButtonTitle = (function () {
    switch (externalAction.type) {
      case "phoneNumber":
        return i18.externalAction.sms();
      case "email":
        return i18.externalAction.email();
      case "share":
        return i18.externalAction.paymentLink();
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
            title={i18.holdButton()}
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
