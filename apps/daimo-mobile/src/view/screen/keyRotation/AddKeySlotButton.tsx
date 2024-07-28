import {
  OpStatus,
  SlotType,
  assert,
  formatFeeAmountOrNull,
  getSlotType,
  now,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { useEffect, useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { Hex } from "viem";

import { useSendWithDeviceKeyAsync } from "../../../action/useSendAsync";
import { i18NLocale, i18n } from "../../../i18n";
import { createPasskey } from "../../../logic/passkey";
import { Account } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextError, TextLight } from "../../shared/text";

const i18 = i18n.addKeySlot;

export function AddKeySlotButton({
  account,
  buttonTitle,
  knownPubkey,
  slot,
  disabled,
  onSuccess,
}: {
  account: Account;
  buttonTitle: string;
  knownPubkey?: Hex; // In case of Add Device, we know the pubkey to add. If not, generate a passkey.
  slot: number;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [knownPubkey, slot]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    const key = await (async () => {
      if (knownPubkey != null) {
        return knownPubkey;
      }

      console.log(`[KEY-ROTATION] creating key ${getSlotType(slot)} ${slot}`);
      assert(
        getSlotType(slot) === SlotType.PasskeyBackup ||
          getSlotType(slot) === SlotType.SecurityKeyBackup
      );

      return await createPasskey(
        daimoChainFromId(account.homeChainId),
        account.name,
        slot
      );
    })();

    console.log(`[ACTION] adding key ${key} ${slot}`);
    const { chainGasConstants } = account;
    return opSender.addSigningKey(slot, key, { nonce, chainGasConstants });
  };

  const { status, message, cost, exec } = useSendWithDeviceKeyAsync({
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
  });

  useEffect(() => {
    if (status === "success" && onSuccess) {
      onSuccess();
    }
  }, [onSuccess, status]);

  const didUserCancel = message.includes("User cancelled");

  const statusMessage = (function () {
    switch (status) {
      case "idle":
        return formatFeeAmountOrNull(i18NLocale, cost.totalDollars);
      case "loading":
        return message;
      case "error":
        if (didUserCancel) {
          return i18.userCancelled();
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
            disabled={disabled}
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
      {statusMessage && (
        <>
          <Spacer h={32} />
          <TextCenter>
            <TextLight>{statusMessage}</TextLight>
          </TextCenter>
        </>
      )}
    </>
  );
}
