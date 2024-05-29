import { assert, getSessionSecretSigningMessage } from "@daimo/common";
import { Address, Hex } from "viem";

import { KeyRegistry } from "../contract/keyRegistry";
import { DB } from "../db/db";
import { ViemClient } from "../network/viemClient";
import { verifyDaimoAccountSignature } from "../utils/daimoAccount";

/*
 * Session keys are pairs of secrets and public keys.
 * The secret corresponding to a public key is used to authenticate the user
 * as the actor of an unsigned API call. Thus the secret is maintained between
 * each of user's devices and the API.
 *
 * To add a new session key, the device must first submit a (secret, pubkey)
 * pair to the API before the device is added to the acocunt. The API stores
 * the secret and pubkey in the DB, but the session key will initially be
 * invalid since the public key is not associated with the account.
 * Then, if the public key is added to the account AFTER the initial session key
 * storage, the API will start associating the secret with the account address
 * as a valid session key.
 *
 * Note that this assumes a device pubkey is unique to a single account, and
 * no one except the owner of the account knows a public key that will be added
 * to the account in future.
 */
export class SessionKeyManager {
  constructor(
    private vc: ViemClient,
    private db: DB,
    private keyRegistry: KeyRegistry
  ) {}

  async insertNewDeviceSessionKey(deviceSecret: string, devicePubkey: Hex) {
    const address = await this.keyRegistry.resolveKey(devicePubkey);
    assert(address === null, "Key already associated with account");

    await this.db.insertSessionKey(deviceSecret, devicePubkey);
  }

  async insertExistingDeviceSessionKey(
    deviceSecret: string,
    devicePubkey: Hex,
    signature: Hex,
    claimedAddress: Address
  ) {
    const isValid = await verifyDaimoAccountSignature(
      getSessionSecretSigningMessage(deviceSecret),
      signature,
      claimedAddress,
      this.vc
    );
    assert(isValid, "Invalid signature");

    const address = await this.keyRegistry.resolveKey(devicePubkey);
    assert(address === claimedAddress, "Key not associated with account");

    await this.db.insertSessionKey(deviceSecret, devicePubkey);
  }

  async isValidSessionKey(deviceSecret: string, address: Address) {
    const sessionKeyRow = await this.db.fetchSessionKey(deviceSecret);

    if (sessionKeyRow == null) return false;

    const resolvedAddr = await this.keyRegistry.resolveKey(
      sessionKeyRow.devicePubkey
    );

    // Pubkey is removed or not associated with an account
    if (resolvedAddr == null) return false;

    return resolvedAddr === address;
  }
}
