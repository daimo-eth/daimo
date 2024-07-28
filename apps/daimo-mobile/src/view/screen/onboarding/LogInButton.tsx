import {
  SlotType,
  findAccountUnusedSlot,
  mnemonicToPublicKey,
  tryOrNull,
} from "@daimo/common";
import { DaimoChain } from "@daimo/contract";
import {
  DaimoNonce,
  DaimoNonceMetadata,
  DaimoNonceType,
  DaimoOpSender,
} from "@daimo/userop";
import { useMemo } from "react";
import { ActivityIndicator } from "react-native";
import { Hex } from "viem";

import { useSendAsync } from "../../../action/useSendAsync";
import { env } from "../../../env";
import { i18n } from "../../../i18n";
import { getWrappedMnemonicSigner } from "../../../logic/key";
import { getWrappedPasskeySigner } from "../../../logic/passkey";
import {
  MnemonicSigner,
  PasskeySigner,
  SecKeySigner,
  Signer,
} from "../../../logic/signer";
import { Account } from "../../../storage/account";
import { ButtonBig } from "../../shared/Button";
import { ErrorRowCentered } from "../../shared/error";

const i18 = i18n.logIn;

// Adds our device key (pubKeyHex) to an existing account, via [pass, sec]key.
export function LogInFromKeyButton({
  account,
  pubKeyHex,
  daimoChain,
  useSecurityKey,
}: {
  account: Account;
  pubKeyHex: Hex;
  daimoChain: DaimoChain;
  useSecurityKey: boolean;
}) {
  const wrappedSigner = getWrappedPasskeySigner(daimoChain, useSecurityKey);

  const signer = useMemo(() => {
    if (useSecurityKey) {
      return { type: "securitykey", account, wrappedSigner } as SecKeySigner;
    } else {
      return { type: "passkey", account, wrappedSigner } as PasskeySigner;
    }
  }, [account, useSecurityKey]);

  const keyType = useSecurityKey ? i18.type.securityKey() : i18.type.passkey();
  const title = i18.logInWith({ keyType });
  return <LogInButton {...{ account, pubKeyHex, daimoChain, signer, title }} />;
}

// Adds our device key (pubKeyHex) to an existing account, via seed phrase.
export function LogInFromSeedButton({
  account,
  pubKeyHex,
  daimoChain,
  mnemonic,
}: {
  account: Account;
  pubKeyHex: Hex;
  daimoChain: DaimoChain;
  mnemonic: string;
}) {
  // Figure out which slot the mnmemonic (seed phrase) key is in
  const parsedKey = tryOrNull(() => mnemonicToPublicKey(mnemonic));
  const keySlot = account.accountKeys.find(
    (k) => k.pubKey === parsedKey?.publicKeyDER
  )?.slot;
  console.log(`[ONBOARDING] mnemonic key slot: ${keySlot}`);

  // Create a signer--can sign signatures and userop for `account`
  const signer = useMemo(() => {
    if (keySlot == null) return null;

    // Mnemonic key is present on the account
    const wrappedSigner = getWrappedMnemonicSigner(mnemonic, keySlot);
    return {
      type: "mnemonic",
      keySlot,
      wrappedSigner,
      account,
    } as MnemonicSigner;
  }, [mnemonic, keySlot]);

  // Handle case where user hasn't finished entering a seed phrase yet.
  if (parsedKey == null) {
    return <ButtonBig type="primary" title={i18.logIn()} disabled />;
  } else if (signer == null) {
    return <ErrorRowCentered message={i18.fromSeed.error()} />;
  } else {
    return (
      <LogInButton
        title={i18.fromSeed.button()}
        {...{ account, pubKeyHex, daimoChain, signer }}
      />
    );
  }
}

// Logs in by adding the current device key to an existing account, signing
// the op to do that with another key (for example, a passkey).
function LogInButton({
  account,
  pubKeyHex,
  daimoChain,
  signer,
  title,
}: {
  account: Account;
  pubKeyHex: Hex;
  daimoChain: DaimoChain;
  signer: Signer;
  title: string;
}) {
  // Figure out which slot the device key will occupy
  const slotType =
    env(daimoChain).deviceType === "phone" ? SlotType.Phone : SlotType.Computer;
  const nextSlot = useMemo(
    () => findAccountUnusedSlot(account, slotType),
    [account]
  );

  // Send a userop to add our device key = log in.
  const nonce = useMemo(
    () => new DaimoNonce(new DaimoNonceMetadata(DaimoNonceType.AddKey)),
    [pubKeyHex]
  );

  const sendFn = async (opSender: DaimoOpSender) => {
    if (!pubKeyHex || !account || nextSlot === null) {
      throw new Error("[ACTION] account account not ready");
    }
    console.log(`[ACTION] adding device ${pubKeyHex}`);
    return opSender.addSigningKey(nextSlot, pubKeyHex, {
      nonce,
      chainGasConstants: account.chainGasConstants,
    });
  };

  const {
    status: addDeviceStatus,
    message: addDeviceMessage,
    exec: addDeviceExec,
  } = useSendAsync({
    dollarsToSend: 0,
    sendFn,
    signer,
  });

  switch (addDeviceStatus) {
    case "idle":
      return <ButtonBig type="primary" title={title} onPress={addDeviceExec} />;
    case "loading":
    case "success":
      return <ActivityIndicator size="large" />;
    case "error":
      return <ErrorRowCentered message={addDeviceMessage} />;
    default:
      throw new Error(`Unknown addDeviceStatus: ${addDeviceStatus}`);
  }
}
