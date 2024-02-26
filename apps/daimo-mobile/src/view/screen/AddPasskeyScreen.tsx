import { OpStatus, SlotType, assert, findUnusedSlot, now } from "@daimo/common";
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
import { createPasskey } from "../../logic/passkey";
import { useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonBig } from "../shared/Button";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import {
  useDisableTabSwipe,
  useExitBack,
  useExitToHome,
  useNav,
} from "../shared/nav";
import { ss } from "../shared/style";
import { TextCenter, TextError, TextLight, TextPara } from "../shared/text";

export function AddPasskeyScreen() {
  const [account] = useAccount();
  assert(account != null);

  const nextSlot = findUnusedSlot(
    account.accountKeys.map((k) => k.slot),
    SlotType.PasskeyBackup
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

  const statusMessage = (function (): ReactNode {
    switch (status) {
      case "idle":
        return `Fee: ${getAmountText({ dollars: cost.totalDollars })}`;
      case "loading":
        return message;
      case "error":
        if (
          message.includes("User cancelled") || // Android
          message.includes("User canceled") // iOS
        ) {
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
            title="Create Backup"
            onPress={exec}
            showBiometricIcon
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ButtonBig type="success" title="Success" disabled />;
      case "error":
        return <ButtonBig type="primary" title="Retry" onPress={exec} />;
    }
  })();

  const cloudName =
    Platform.OS === "ios" ? "iCloud Keychain" : "Google Password Manager";

  const nav = useNav();
  const goBack = useExitBack();
  const goHome = useExitToHome();
  useDisableTabSwipe(nav);

  return (
    <View style={ss.container.screen}>
      <ScreenHeader title="Passkey Backup" onBack={goBack || goHome} />
      <Spacer h={32} />
      <View style={ss.container.padH16}>
        <TextPara>
          Back up your account by saving a secure passkey in {cloudName}.
        </TextPara>
        <Spacer h={8} />
        <TextPara>
          This way, your funds will be safe even if you lose your device.
        </TextPara>
      </View>
      <Spacer h={32} />
      {button}
      <Spacer h={16} />
      <TextCenter>
        <TextLight>{statusMessage}</TextLight>
      </TextCenter>
    </View>
  );
}
