import {
  DaimoLink,
  OpStatus,
  assert,
  dollarsToAmount,
  formatDaimoLink,
} from "@daimo/common";
import { ephemeralNotesAddress } from "@daimo/contract";
import {
  DaimoAccount,
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
} from "@daimo/userop";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Share,
  ShareAction,
  View,
} from "react-native";
import { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

import { useSendAsync } from "../../../action/useSendAsync";
import { useAccount } from "../../../model/account";
import { getAmountText } from "../../shared/Amount";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextError, TextLight } from "../../shared/text";

/** Creates a Note. User picks amount, then sends message via ShareSheet. */
export function SendNoteButton({
  dollars,
  onCreated,
}: {
  dollars: number;
  onCreated: () => void;
}) {
  const [ephemeralPrivKey] = useState<Hex>(generatePrivateKey);
  const ephemeralOwner = useMemo(
    () => ephemeralPrivKey && privateKeyToAccount(ephemeralPrivKey).address,
    [ephemeralPrivKey]
  );

  const [account] = useAccount();
  assert(account != null);

  const nonceMetadata = new DaimoNonceMetadata(DaimoNonceType.CreateNote);
  const nonce = useMemo(() => new DaimoNonce(nonceMetadata), []);

  const { status, message, cost, exec } = useSendAsync({
    enclaveKeyName: account.enclaveKeyName,
    dollarsToSend: dollars,
    sendFn: async (account: DaimoAccount) => {
      return account.createEphemeralNote(ephemeralOwner, `${dollars}`, nonce);
    },
    pendingOp: {
      type: "transfer",
      status: OpStatus.pending,
      from: account.address,
      to: ephemeralNotesAddress,
      amount: Number(dollarsToAmount(dollars)),
      timestamp: Date.now() / 1e3,
      nonceMetadata: nonceMetadata.toHex(),
    },
  });

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Works like cash, redeemable by recipient\n${
          dollars <= 0
            ? ""
            : `Total incl. fees ${getAmountText({
                dollars: cost.totalDollars,
              })}`
        }`;
      case "loading":
        return message;
      case "error":
        return <TextError>{message}</TextError>;
      case "success":
        return "Works like cash, redeemable by recipient";
      default:
        return null;
    }
  })();

  const nav = useNav();

  const sendNote = useCallback(async () => {
    if (status !== "success") return;
    if (ephemeralOwner == null) return;

    try {
      const link: DaimoLink = {
        type: "note",
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
        nav.navigate("Home");
      } else if (result.action === Share.dismissedAction) {
        // Only on iOS
        console.log("[APP] Note share reverted");
        // TODO: Suggest revert or retry?
      }
    } catch (error: any) {
      console.error("[APP] Note share error:", error);
    }
  }, [ephemeralOwner, ephemeralPrivKey, status]);

  const button = (function () {
    switch (status) {
      case "idle":
        return (
          <ButtonBig
            type="primary"
            title="Create Payment Link"
            onPress={exec}
            disabled={dollars === 0}
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

  useEffect(() => {
    if (status === "success") onCreated();
  }, [status]);

  return (
    <View style={ss.container.ph16}>
      {button}
      <Spacer h={8} />
      <TextLight>
        <TextCenter>{statusMessage}</TextCenter>
      </TextLight>
    </View>
  );
}
