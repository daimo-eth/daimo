import { OpStatus, assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { ReactNode, useMemo } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { useSendAsync } from "../../action/useSendAsync";
import { SlotType, findUnusedSlot } from "../../logic/keySlot";
import { createPasskey } from "../../logic/passkey";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { useNav } from "../shared/nav";
import { ss } from "../shared/style";
import { TextCenter, TextError, TextLight, TextPara } from "../shared/text";

export function AddPasskeyScreen() {
  const [account] = useAccount();
  assert(account != null);

  const nextSlot = findUnusedSlot(
    account.accountKeys.map((k) => k.slot),
    SlotType.Backup
  );

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    []
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    const pubKey = await createPasskey(
      daimoChainFromId(account.homeChainId),
      account.name,
      nextSlot
    );
    console.log(`[ACTION] adding passkey ${pubKey}`);
    return opSender.addSigningKey(nextSlot, pubKey, {
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
      slot: nextSlot,
      rotationType: "add",
      timestamp: Date.now() / 1e3,
    },
    accountTransform: (acc, pendingOp) => {
      assert(pendingOp.type === "keyRotation");
      return {
        ...acc,
        pendingKeyRotation: [...acc.pendingKeyRotation, pendingOp],
      };
    },
  });

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Fee: ${getAmountText({ dollars: cost.totalDollars })}`;
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
          <ButtonBig type="primary" title="Create Backup" onPress={exec} />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="danger" title="Error" disabled />;
    }
  })();

  const cloudName =
    Platform.OS === "ios" ? "iCloud Keychain" : "Google Password Manager";

  const nav = useNav();
  const goBack = () => nav.goBack();

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Passkey Backup" onBack={goBack} />
      <Spacer h={32} />
      <TextPara>
        Back up your account by saving a secure passkey in {cloudName}.
      </TextPara>
      <TextPara>
        This way, your funds will be safe even if you lose your device.
      </TextPara>
      <Spacer h={32} />
      {button}
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </View>
  );
}
