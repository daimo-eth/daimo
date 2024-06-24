import { SigningCallback } from "@daimo/userop";

import { Account } from "../storage/account";

export type DeviceKeySigner = {
  type: "deviceKey";
  keySlot: number;
  wrappedSigner: SigningCallback;
  account: Account;
};

export type PasskeySigner = {
  type: "passkey";
  wrappedSigner: SigningCallback;
  account: Account;
};

export type SecKeySigner = {
  type: "securitykey";
  wrappedSigner: SigningCallback;
  account: Account;
};

export type MnemonicSigner = {
  type: "mnemonic";
  keySlot: number;
  wrappedSigner: SigningCallback;
  account: Account;
};

export type Signer =
  | DeviceKeySigner
  | PasskeySigner
  | SecKeySigner
  | MnemonicSigner;
