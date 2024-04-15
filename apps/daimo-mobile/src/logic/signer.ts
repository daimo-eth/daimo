import { SigningCallback } from "@daimo/userop";

import { Account } from "../model/account";

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

export type SecuritykeySigner = {
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
  | SecuritykeySigner
  | MnemonicSigner;
