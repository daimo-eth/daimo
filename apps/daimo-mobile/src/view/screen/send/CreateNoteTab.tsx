import { DaimoLink, assert, formatDaimoLink } from "@daimo/common";
import { DaimoAccount } from "@daimo/userop";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Share } from "react-native";
import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { CancelHeader } from "./CancelHeader";
import { useSendAsync } from "../../../action/useSendAsync";
import { fetchNotesContractAllowance } from "../../../logic/note";
import { useAccount } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import { AmountInput } from "../../shared/Input";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextError, TextSmall } from "../../shared/text";

export function CreateNoteTab({ hide }: { hide: () => void }) {
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<Hex>();

  const ephemeralOwner = useMemo(
    () =>
      ephemeralPrivateKey
        ? privateKeyToAccount(ephemeralPrivateKey).address
        : null,
    [ephemeralPrivateKey]
  );

  const [dollars, setDollars] = useState(0);

  const [account] = useAccount();
  assert(account != null);
  const { address } = account;

  const [isNotesContractApproved, setIsNotesContractApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const allowance = await fetchNotesContractAllowance(address);
      setIsNotesContractApproved(allowance > 0);

      const privKey = generatePrivateKey();
      setEphemeralPrivateKey(privKey);
    })();
  }, []);

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      if (ephemeralOwner == null) throw new Error("Note key not generated yet");
      return account.createEphemeralNote(
        ephemeralOwner,
        `${dollars}`,
        !isNotesContractApproved
      );
    }
  );

  // TODO: load estimated fees
  const fees = 0.05;
  const totalDollars = dollars + fees;

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        if (dollars === 0) return null;
        return `Total incl. fees $${totalDollars.toFixed(2)}`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      default:
        return null;
    }
  })();

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            title="Create note"
            onPress={exec}
            type="primary"
            disabled={dollars === 0}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  useEffect(() => {
    (async () => {
      if (status !== "success") return;
      if (ephemeralOwner == null) return;

      // TODO: We can optimistically do this on loading rather than wait
      // for success.
      try {
        const link: DaimoLink = {
          type: "note",
          ephemeralOwner,
          ephemeralPrivateKey,
        };
        const url = formatDaimoLink(link);

        const result = await Share.share({ url });
        if (result.action === Share.sharedAction) {
          console.log(
            "[APP] Note shared with activity type ",
            result.activityType || "unknown"
          );
        } else if (result.action === Share.dismissedAction) {
          // Only on iOS
          console.log("[APP] Note share reverted");
          // TODO: Suggest revert or retry?
        }
      } catch (error: any) {
        console.error("[APP] Note share error:", error);
      }
    })();
  }, [status]);

  return (
    <>
      <CancelHeader hide={hide}>Creating note</CancelHeader>
      <Spacer h={32} />
      <AmountInput value={dollars} onChange={setDollars} />
      <Spacer h={32} />
      {button}
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
    </>
  );
}
