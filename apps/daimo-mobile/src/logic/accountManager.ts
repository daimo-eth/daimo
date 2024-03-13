import {
  DaimoLink,
  DaimoLinkNoteV2,
  DaimoNoteStatus,
  DisplayOpEvent,
  EAccount,
  OpStatus,
  assert,
  assertEqual,
  assertNotNull,
  dollarsToAmount,
  formatDaimoLink,
  getNoteClaimSignatureFromSeed,
  now,
  stripSeedFromNoteLink,
} from "@daimo/common";
import {
  DaimoChain,
  daimoChainFromId,
  daimoChainFromStr,
} from "@daimo/contract";
import { useEffect, useState } from "react";
import { MMKV } from "react-native-mmkv";
import { Address } from "viem";

import { ActHandle } from "../action/actStatus";
import { cacheEAccounts } from "../logic/addr";
import {
  EnclaveKeyInfo,
  deleteEnclaveKey,
  loadEnclaveKey,
  loadOrCreateEnclaveKey,
} from "../logic/enclave";
import { env } from "../logic/env";
import {
  Account,
  createEmptyAccount,
  defaultEnclaveKeyName,
  deviceAPIKeyName,
  parseAccount,
  serializeAccount,
} from "../model/account";

/** Loads and saves Daimo account data from storage. Notifies listeners. */
export function getAccountManager(): AccountManager {
  if (_accountManager == null) {
    _accountManager = new AccountManager();
  }
  return _accountManager;
}

let _accountManager: AccountManager | null = null;

/**
 * Loads and saves Daimo account data from storage. Notifies listeners.
 *
 * Possible states:
 * ACCOUNT, ENCLAVE KEY MISSING LOCALLY OR NOT ON ACCOUNT. Show error page.
 * ENCLAVE KEY, ACCOUNT MISSING. Load account by signing key.
 * BOTH MISSING. Show onboarding page.
 * BOTH PRESENT. Show app, see MainTabNav.
 *
 * The AccountManager enforces consistency between account, key, and chain.
 **/
class AccountManager {
  private mmkv = new MMKV();
  /** Listeners are called when account changes (common) or enclave key, create
   *  account progress, or chain (rare). */
  private listeners = new Set<(a: Account | null) => void>();
  /** The current logged-in Daimo account */
  private currentAccount: Account | null;
  /** The current enclave key. There are error states where this key missing
   *  locally or missing from the onchain account. */
  private keyInfo: EnclaveKeyInfo | null = null;
  /** Always matches home chain of account, if logged in. */
  private daimoChain: DaimoChain = daimoChainFromStr(process.env.DAIMO_CHAIN);
  /** Present only when currentAccount is null & in process of being created. */
  private createAccountHandle: ActHandle | null = null;

  constructor() {
    // On first load, load+save to ensure latest serialization version.
    const accountJSON = this.mmkv.getString("account");
    console.log(`[ACCOUNT] read account JSON: ${accountJSON}`);
    this.currentAccount = parseAccount(accountJSON);
    this.setCurrentAccount(this.currentAccount);

    // Load enclave key
    this.loadEnclaveKey();
  }

  async loadEnclaveKey() {
    try {
      this.keyInfo =
        this.currentAccount == null
          ? await loadOrCreateEnclaveKey(defaultEnclaveKeyName)
          : await loadEnclaveKey(this.currentAccount.enclaveKeyName);
      console.log(`[ACCOUNT] loaded key: ${JSON.stringify(this.keyInfo)}`);
      this.notifyListeners();
    } catch (e: any) {
      console.error(`[ACCOUNT] error loading enclave key: ${e}`);
    }
  }

  private notifyListeners() {
    try {
      console.log(`[ACCOUNT] notifying ${this.listeners.size} listeners`);
      this.listeners.forEach((l) => l(this.currentAccount));
    } catch (e) {
      console.log(`[ACCOUNT] error notifying listeners: ${e}`);
    }
  }

  getEnclaveKeyInfo() {
    return this.keyInfo;
  }

  addListener(listener: (a: Account | null) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (a: Account | null) => void) {
    this.listeners.delete(listener);
  }

  // Applies an edit to the current account, saves, and notifies listeners.
  transform(f: (a: Account) => Account) {
    if (this.currentAccount == null) {
      console.log("[ACCOUNT] SKIPPING transform: no current account");
      return;
    }
    console.log("[ACCOUNT] transform");
    this.setCurrentAccount(f(this.currentAccount));
  }

  getAccount(): Account | null {
    return this.currentAccount;
  }

  // Overwrites the current account, saves, and notifies listeners.
  private setCurrentAccount = (account: Account | null) => {
    console.log("[ACCOUNT] " + (account ? `save ${account.name}` : "clear"));

    // Ensure consistency between chain and account
    if (account != null) {
      this.daimoChain = daimoChainFromId(account.homeChainId);
    }

    // Cache accounts so that addresses show up with correct display names.
    // Would be cleaner use a listener, but must run first.
    if (account) cacheEAccounts(account.namedAccounts);

    this.currentAccount = account;
    this.mmkv.set("account", serializeAccount(account));
    this.notifyListeners();
  };

  getDaimoChain(): DaimoChain {
    return this.daimoChain;
  }

  setDaimoChain(daimoChain: DaimoChain) {
    // Always ensure consistency between chain and account
    if (this.currentAccount) throw new Error("Can't chain on existing account");
    this.daimoChain = daimoChain;
    this.notifyListeners();
  }

  // Find existing account
  async pollForAccountByKey() {
    const account = this.currentAccount;
    if (account != null) {
      console.log(`[ACCOUNT] skip pollForAccountByKey, loaded ${account.name}`);
      return;
    } else if (this.keyInfo?.pubKeyHex == null) {
      console.log(`[ACCOUNT] skip pollForAccountByKey, no signing key loaded`);
      return;
    }
    const { pubKeyHex, enclaveKeyName } = this.keyInfo;

    console.log(`[ACCOUNT] pollForAccountByKey, key ${pubKeyHex}`);
    const rpcFunc = env(this.daimoChain).rpcFunc;
    let acc: EAccount | null = null;
    try {
      acc = await rpcFunc.lookupEthereumAccountByKey.query({ pubKeyHex });
    } catch (e: any) {
      console.error(`[ACCOUNT] pollForAccountByKey error: ${e}`);
      return;
    }

    if (acc == null) {
      console.log(`[ACCOUNT] pollForAccountByKey no account found`);
      return;
    } else if (acc.name == null) {
      console.error(`[ACCOUNT] pollForAccountByKey found ${acc.addr}, no name`);
      return;
    }

    console.log(`[ACTION] pollForAccountByKey saving ${acc.name}, ${acc.addr}`);
    this.setCurrentAccount(
      createEmptyAccount(
        {
          enclaveKeyName,
          enclavePubKey: pubKeyHex,
          name: acc.name,
          address: acc.addr,
        },
        this.daimoChain
      )
    );
  }

  // Create new account
  async createAccount(name: string, inviteLink: DaimoLink) {
    console.log(`[ACCOUNT] createAccount ${name}, ${inviteLink}`);
    assert(this.currentAccount == null, "Can't create, have existing account");
    assert(this.createAccountHandle?.status !== "loading", "Already creating");

    // Get enclave key
    const keyInfo = await loadOrCreateEnclaveKey(defaultEnclaveKeyName);
    assert(keyInfo.pubKeyHex != null, "Can't create, no signing key");
    const { pubKeyHex, enclaveKeyName } = keyInfo;

    // Get device API key
    const deviceAPIKeyInfo = await loadOrCreateEnclaveKey(deviceAPIKeyName);
    const deviceAttestationString = assertNotNull(deviceAPIKeyInfo.pubKeyHex);

    // Strip private seed from notes links before lookup
    const sanitizedUrl = formatDaimoLink(stripSeedFromNoteLink(inviteLink));

    const { rpcFunc } = env(this.daimoChain);
    this.createAccountHandle = {
      status: "loading",
      message: "Creating account...",
    };
    this.notifyListeners();
    try {
      console.log(`[ACCOUNT] createAccount running deployWallet ${name}`);
      const result = await rpcFunc.deployWallet.mutate({
        name,
        pubKeyHex,
        inviteLink: sanitizedUrl,
        deviceAttestationString,
      });
      console.log(`[ACCOUNT] deployWallet returned: ${JSON.stringify(result)}`);
      assertEqual(result.status, "success");
      const { address } = result;

      // Save the newly created account
      const newAcc = createEmptyAccount(
        {
          enclaveKeyName,
          enclavePubKey: pubKeyHex,
          name,
          address,
        },
        this.daimoChain
      );

      // If invite link is a payment link, claim it & add as pending transfer
      if (inviteLink.type === "notev2") {
        this.createAccountHandle.message = "Claiming payment link...";
        this.notifyListeners();
        const pendingOp = await this.tryClaimPaymentLink(address, inviteLink);
        if (pendingOp != null) newAcc.recentTransfers.push(pendingOp);
      }

      console.log(`[ACCOUNT] createAccount saving ${newAcc.name}, ${address}`);
      this.createAccountHandle = null;
      this.keyInfo = keyInfo;
      this.setCurrentAccount(newAcc); // Saves account, notifies listeners
    } catch (e: any) {
      console.error(`[ACCOUNT] createAccount error: ${e}`);
      const retry = () => getAccountManager().createAccount(name, inviteLink);
      this.createAccountHandle = { status: "error", message: e.message, retry };
      this.notifyListeners();
    }
  }

  // Returns a pending claimLink op.
  private async tryClaimPaymentLink(
    address: Address,
    inviteLink: DaimoLinkNoteV2
  ) {
    const { rpcFunc } = env(this.daimoChain);
    const sanitizedUrl = formatDaimoLink(stripSeedFromNoteLink(inviteLink));

    try {
      console.log(`[ACCOUNT] looking up invite payment link`, inviteLink);
      // TODO: remove this redundant extra roundtrip
      const noteStatus = (await rpcFunc.getLinkStatus.query({
        url: sanitizedUrl,
      })) as DaimoNoteStatus;

      console.log(`[ACCOUNT] claiming invite payment link`, inviteLink);
      const txHash = await this.claimInvitePaymentLink(
        address,
        inviteLink,
        noteStatus
      );
      cacheEAccounts([noteStatus.sender]);
      return {
        type: "claimLink",
        amount: Number(dollarsToAmount(inviteLink.dollars)),
        status: OpStatus.pending,
        timestamp: now(),
        from: noteStatus.sender.addr,
        noteStatus,
        to: address,
        txHash,
      } as DisplayOpEvent;
    } catch (e: any) {
      console.error(`[ACCOUNT] error claiming invite payment link: ${e}`);
    }
  }

  // Claims an invite link
  private async claimInvitePaymentLink(
    address: Address,
    inviteLink: DaimoLinkNoteV2,
    noteStatus: DaimoNoteStatus
  ) {
    const { rpcFunc } = env(this.daimoChain);
    const ephemeralSignature = await getNoteClaimSignatureFromSeed(
      noteStatus.sender.addr,
      address,
      inviteLink.seed
    );
    const claimTxHash = await rpcFunc.claimEphemeralNoteSponsored.mutate({
      ephemeralOwner: noteStatus.ephemeralOwner!,
      recipient: address,
      signature: ephemeralSignature,
    });
    return claimTxHash;
  }

  // Deletes the account and key
  async deleteAccountAndKey() {
    console.log(`[ACCOUNT] deleteAccountAndKey`);
    assert(this.currentAccount != null, "No account");
    const { enclaveKeyName, name } = this.currentAccount;
    assert(this.keyInfo?.enclaveKeyName === enclaveKeyName, "Bad key");

    console.log(`[ACCOUNT] DELETING account ${name}, key ${enclaveKeyName}`);
    await deleteEnclaveKey(enclaveKeyName);

    this.createAccountHandle = null;
    this.keyInfo = null;
    this.setCurrentAccount(null);
  }

  // Returns summary of account + device + onboarding state.
  getAccountAndKeyInfo() {
    const { currentAccount, createAccountHandle, keyInfo } = this;
    return { account: currentAccount, createAccountHandle, keyInfo };
  }
}

/**
 * Returns current Daimo account, or null if not logged in.
 * Avoid setAccount after async. Instead, use transform() to avoid races.
 */
export function useAccount(): [Account | null] {
  const manager = getAccountManager();

  // State + listeners pattern
  const [accState, setAccState] = useState<Account | null>(
    manager.getAccount()
  );
  useEffect(() => {
    manager.addListener(setAccState);
    return () => manager.removeListener(setAccState);
  }, []);

  return [accState];
}

export function useAccountAndKeyInfo() {
  const manager = getAccountManager();

  const [ret, setRet] = useState(manager.getAccountAndKeyInfo());
  useEffect(() => {
    const listener = () => setRet(manager.getAccountAndKeyInfo());
    manager.addListener(listener);
    return () => manager.removeListener(listener);
  }, []);

  return ret;
}

export function useDaimoChain(): DaimoChain {
  const manager = getAccountManager();
  const [chain, setChain] = useState<DaimoChain>(manager.getDaimoChain());

  useEffect(() => {
    const listener = () => setChain(manager.getDaimoChain());
    manager.addListener(listener);
    return () => manager.removeListener(listener);
  }, []);

  return chain;
}
