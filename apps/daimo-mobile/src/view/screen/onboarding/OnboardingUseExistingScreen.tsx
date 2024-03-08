import { SlotType, assert, findUnusedSlot } from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { base64 } from "@scure/base";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Hex, hexToBytes } from "viem";

import { OnboardingHeader } from "./OnboardingHeader";
import { ActStatus } from "../../../action/actStatus";
import { useSendAsync } from "../../../action/useSendAsync";
import { useExitBack } from "../../../common/nav";
import {
  useAccountAndKeyInfo,
  useDaimoChain,
} from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { createAddDeviceString } from "../../../logic/key";
import { requestPasskeySignature } from "../../../logic/passkey";
import {
  Account,
  createEmptyAccount,
  defaultEnclaveKeyName,
} from "../../../model/account";
import { hydrateAccount } from "../../../sync/sync";
import { ButtonBig } from "../../shared/Button";
import Spacer from "../../shared/Spacer";
import {
  TextBody,
  TextCenter,
  TextError,
  TextLight,
  TextPara,
} from "../../shared/text";
import { QRCodeBox } from "../QRScreen";

export function OnboardingUseExistingScreen() {
  // On-chain signing key slot identifies key type (phone, computer, etc)
  const daimoChain = useDaimoChain();
  const slotType =
    env(daimoChain).deviceType === "phone" ? SlotType.Phone : SlotType.Computer;

  // Wait for enclave key to be loaded
  const { account, keyInfo } = useAccountAndKeyInfo();

  const onPrev = useExitBack();

  if (account != null) return null; // Will nav to home screen shortly.

  if (keyInfo?.pubKeyHex == null) {
    return (
      <View>
        <OnboardingHeader title="Existing Account" onPrev={onPrev} />
        <View style={styles.useExistingPage}>
          <Spacer h={24} />
          <TextCenter>
            <TextBody>Generating keys...</TextBody>
          </TextCenter>
        </View>
      </View>
    );
  }

  return (
    <View>
      <OnboardingHeader title="Existing Account" onPrev={onPrev} />
      <View style={styles.useExistingPage}>
        <Spacer h={16} />
        <QRCodeBox
          value={createAddDeviceString(keyInfo?.pubKeyHex, slotType)}
        />
        <Spacer h={16} />
        <TextCenter>
          <TextPara>
            Add this {env(daimoChain).deviceType} to an existing account. Go to
            Daimo {`>`} Settings {`>`} Add Device on your other device to scan
            the QR code.
          </TextPara>
        </TextCenter>
        <Spacer h={24} />
        <TextCenter>
          <TextLight>or</TextLight>
        </TextCenter>
        <Spacer h={24} />
        <RestoreFromBackupButton
          pubKeyHex={keyInfo?.pubKeyHex}
          slotType={slotType}
          daimoChain={daimoChain}
        />
      </View>
    </View>
  );
}

function RestoreFromBackupButton({
  pubKeyHex,
  slotType,
  daimoChain,
}: {
  pubKeyHex: Hex;
  slotType: SlotType;
  daimoChain: DaimoChain;
}) {
  const [passkeyAccount, setPasskeyAccount] = useState<Account | undefined>(
    undefined
  );

  const nextSlot = useMemo(
    () =>
      passkeyAccount
        ? findUnusedSlot(
            passkeyAccount.accountKeys.map((k) => k.slot),
            slotType
          )
        : null,
    [passkeyAccount]
  );

  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [pubKeyHex]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    if (!pubKeyHex || !passkeyAccount || nextSlot === null)
      throw new Error("[ACTION] passkey account not ready");
    console.log(`[ACTION] adding device ${pubKeyHex}`);
    return opSender.addSigningKey(nextSlot, pubKeyHex, {
      nonce,
      chainGasConstants: passkeyAccount.chainGasConstants,
    });
  };

  const {
    status: addDeviceStatus,
    message: addDeviceMessage,
    exec: addDeviceExec,
  } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    passkeyAccount,
  });

  const [restoreStatus, setRestoreStatus] = useState<{
    status: ActStatus;
    message: string;
  }>({ status: "idle", message: "Restore from backup" });

  const onRestoreBackup = async () => {
    assert(pubKeyHex !== undefined);
    console.log(`[ONBOARDING] restore backup attempt`);
    setRestoreStatus({ status: "loading", message: "Requesting backup" });

    const bChallenge = hexToBytes("0xdead");
    const challengeB64 = base64.encode(bChallenge);
    try {
      const { accountName } = await requestPasskeySignature(
        challengeB64,
        env(daimoChain).passkeyDomain
      );

      const rpcFunc = env(daimoChain).rpcFunc;
      const addr = await rpcFunc.resolveName.query({ name: accountName });

      if (!addr) {
        setRestoreStatus({
          status: "error",
          message: "Backup account not found",
        });
        return;
      }

      console.log(`[ONBOARDING] trying to restore ${accountName} ${addr}`);

      const newAccount = createEmptyAccount(
        {
          name: accountName,
          address: addr,
          enclaveKeyName: defaultEnclaveKeyName,
          enclavePubKey: pubKeyHex,
        },
        daimoChain
      );

      const syncedAccount = await hydrateAccount(newAccount);

      setPasskeyAccount(syncedAccount);

      // now add device will work if we use the passkey account
      // We don't set the main account to the passkey account because
      // we haven't yet added this device key to it.
      setRestoreStatus({
        status: "success",
        message: `Successfully found account ${accountName}`,
      });
    } catch (e: any) {
      console.error(e);
      setRestoreStatus({ status: "error", message: e.message });
      throw e;
    }
  };

  const addDeviceElement = (function () {
    switch (addDeviceStatus) {
      case "idle":
        return (
          <>
            <ButtonBig
              type="primary"
              title="Load account"
              onPress={addDeviceExec}
            />
            <Spacer h={16} />
            <TextCenter>
              <TextBody>{restoreStatus.message}</TextBody>
            </TextCenter>
          </>
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success":
        return <ActivityIndicator size="large" />;
      case "error":
        return (
          <>
            <TextCenter>
              <TextError>{addDeviceMessage}</TextError>
            </TextCenter>
          </>
        );
    }
  })();

  const restoreElement = (function () {
    switch (restoreStatus.status) {
      case "idle":
        return (
          <ButtonBig
            type="primary"
            title="Restore from backup"
            onPress={onRestoreBackup}
          />
        );
      case "loading":
        return <ActivityIndicator size="large" />;
      case "success": {
        return <></>;
      }
      case "error":
        return (
          <>
            <TextCenter>
              <TextError>{restoreStatus.message}</TextError>
            </TextCenter>
          </>
        );
    }
  })();

  return (
    <>
      {restoreStatus.status !== "success" && restoreElement}
      {restoreStatus.status === "success" && addDeviceElement}
    </>
  );
}

const styles = StyleSheet.create({
  useExistingPage: {
    paddingHorizontal: 24,
  },
});
