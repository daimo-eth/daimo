import {
  OpStatus,
  now,
  assert,
  formatFeeAmountOrNull,
  getSlotType,
  SlotType,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { useMemo, ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import { Hex } from "viem";

import { useSendAsync } from "../../../action/useSendAsync";
import { createPasskey } from "../../../logic/passkey";
import { Account } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextError, TextCenter, TextLight } from "../../shared/text";

export function AddKeySlotButton({
  account,
  buttonTitle,
  knownPubkey,
  slot,
}: {
  account: Account;
  buttonTitle: string;
  knownPubkey?: Hex; // In case of Add Device, we know the pubkey to add. If not, generate a passkey.
  slot: number;
}) {
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [knownPubkey, slot]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    const key = await (async () => {
      if (!knownPubkey) {
        console.log(`[KEY-ROTATION] creating ke ${getSlotType(slot)} ${slot}`);
        assert(
          getSlotType(slot) === SlotType.PasskeyBackup ||
            getSlotType(slot) === SlotType.SecurityKeyBackup
        );

        return await createPasskey(
          daimoChainFromId(account.homeChainId),
          account.name,
          slot
        );
      } else return knownPubkey;
    })();

    console.log(`[ACTION] adding key ${key} ${slot}`);
    return opSender.addSigningKey(slot, key, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  const { status, message, cost, exec } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    pendingOp: {
      type: "keyRotation",
      status: OpStatus.pending,
      slot,
      rotationType: "add",
      timestamp: now(),
    },
    accountTransform: (acc, pendingOp) => {
      assert(pendingOp.type === "keyRotation");
      return {
        ...acc,
        pendingKeyRotation: [...acc.pendingKeyRotation, pendingOp],
      };
    },
    signerType: "deviceKey",
  });

  const didUserCancel = message.includes("User cancelled");

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return formatFeeAmountOrNull(cost.totalDollars);
      case "loading":
        return message;
      case "error":
        if (didUserCancel) {
          return "Cancelled";
        }
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
            type="primary"
            title={buttonTitle}
            onPress={exec}
            showBiometricIcon
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        if (didUserCancel) {
          return <ButtonBig type="primary" title="Retry" onPress={exec} />;
        }
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  return (
    <>
      {button}
      <Spacer h={32} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </>
  );
}
