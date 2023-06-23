import { DaimoAccount } from "@daimo/userop";
import { ReactNode, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Share, View } from "react-native";
import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { CancelHeader } from "./CancelHeader";
import { useSendAsync } from "../../../action/useSendAsync";
import { assert, assertNotNull } from "../../../logic/assert";
import { ChainContext } from "../../../logic/chain";
import { fetchNotesContractAllowance } from "../../../logic/note";
import { useAccount } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import { AmountInput } from "../../shared/Input";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextSmall } from "../../shared/text";

export function CreateNoteTab({ hide }: { hide: () => void }) {
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<Hex>("0x");

  const { chain } = useContext(ChainContext);
  const { clientL2 } = assertNotNull(chain);

  const [dollars, setDollars] = useState(0);

  const [account] = useAccount();
  assert(account != null);
  const { address } = account;

  const [isNotesContractApproved, setIsNotesContractApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const allowance = await fetchNotesContractAllowance(clientL2, address);
      setIsNotesContractApproved(allowance > 0);

      const privKey = generatePrivateKey();
      setEphemeralPrivateKey(privKey);
    })();
  }, []);

  const { status, message, exec } = useSendAsync(
    account.enclaveKeyName,
    async (account: DaimoAccount) => {
      const ephemeralOwner = privateKeyToAccount(ephemeralPrivateKey).address;
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
        return <ButtonBig title="Success" disabled />;
      case "error":
        return <ButtonBig title="Error" disabled />;
    }
  })();

  useEffect(() => {
    (async () => {
      if (status !== "success") return;
      // TODO: We can optimistically do this on loading rather than wait
      // for success.
      try {
        const result = await Share.share({
          message: `${account.name} paid you $${dollars}. Claim your money: daimo://note?ephemeralPrivateKey=${ephemeralPrivateKey}`,
          url: `daimo://note?ephemeralPrivateKey=${ephemeralPrivateKey}`,
        });
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
      <View style={ss.spacer.h32} />
      <AmountInput value={dollars} onChange={setDollars} />
      <View style={ss.spacer.h32} />
      {button}
      <TextSmall>
        <TextCenter>{statusMessage}</TextCenter>
      </TextSmall>
    </>
  );
}
