import {
  AddrLabel,
  DaimoLink,
  DaimoLinkNoteV2,
  DaimoNoteStatus,
  TransferClog,
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
import { Address, Hex } from "viem";

import { cacheEAccounts } from "./eAccountCache";
import { cacheLandlineAccounts } from "./landlineAccountCache";
import { getRpcFunc } from "./trpc";
import { ActHandle } from "../action/actStatus";
import {
  EnclaveKeyInfo,
  deleteEnclaveKey,
  loadEnclaveKey,
  loadOrCreateEnclaveKey,
} from "../logic/enclave";
import {
  Account,
  createEmptyAccount,
  defaultEnclaveKeyName,
  deviceAPIKeyName,
  parseAccount,
  serializeAccount,
} from "../storage/account";

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
  /**
   * Listeners are called when account changes (common) or enclave key, create
   * account progress, or chain (rare).
   */
  private listeners = new Set<(a: Account | null) => void>();
  /**
   * The current logged-in Daimo account
   */
  private currentAccount: Account | null;
  /**
   * The current enclave key. Null = still loading, state unknown.
   * Otherwise, pubKeyHex can be null = no key in enclave.
   * Finally, pubKeyHex present = key available in enclave.
   *
   * There are error states where this key missing locally or missing from the
   * onchain account.
   */
  private keyInfo: EnclaveKeyInfo | null = null;
  /**
   * Always matches home chain of account, if logged in.
   * Switchable during login by entering eg. a testnet invite code.
   */
  private daimoChain: DaimoChain = daimoChainFromStr("base");
  /**
   * Present only when currentAccount is null & in process of being created.
   */
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
    if (account) {
      cacheEAccounts(account.namedAccounts);
      cacheLandlineAccounts(account.landlineAccounts);
    }

    this.currentAccount = account;
    this.mmkv.set("account", serializeAccount(account));
    this.notifyListeners();
  };

  getDaimoChain(): DaimoChain {
    return this.daimoChain;
  }

  setDaimoChain(daimoChain: DaimoChain) {
    if (this.daimoChain === daimoChain) return;

    // Always ensure consistency between chain and account
    if (this.currentAccount != null) {
      throw new Error("Can't set chain on existing account");
    }
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
    const rpcFunc = getRpcFunc(this.daimoChain);
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
    if (this.currentAccount != null) {
      console.log(
        `[ACCOUNT] ignoring found account, already have ${this.currentAccount.name}`
      );
      return;
    }

    // Current account guaranteed null, set it to the found account:
    this.setNewAccount(enclaveKeyName, pubKeyHex, acc.name, acc.addr);
  }

  // Create new account
  async createAccount(name: string, inviteLink: DaimoLink) {
    console.log(
      `[ACCOUNT] createAccount ${name}, ${formatDaimoLink(inviteLink)}`
    );
    const existingAcc = this.currentAccount;
    assert(existingAcc == null, "Can't create, have existing account");
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

    const rpcFunc = getRpcFunc(this.daimoChain);
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
      const { address, faucetTransfer } = result;

      // Save the newly created account.
      // (Avoid a race where we find it via polling)
      if (this.currentAccount == null) {
        console.log(`[ACCOUNT] createAccount saving ${name}, ${address}`);
        this.setNewAccount(enclaveKeyName, pubKeyHex, name, address);
      } else {
        console.log(
          `[ACCOUNT] createAccount NOT saving, existing (polled) acct ${this.currentAccount.name}`
        );
      }

      // If we received a faucet tx, add it as a pending op
      if (faucetTransfer != null) {
        const faucet = { label: AddrLabel.Faucet, addr: faucetTransfer.from };
        this.transform((a) => ({
          ...a,
          recentTransfers: [...a.recentTransfers, faucetTransfer],
          namedAccounts: [...a.namedAccounts, faucet],
        }));
      }

      // Invariant: if we get here, we have a new account. Save key info.
      this.keyInfo = keyInfo;
      this.createAccountHandle = null;

      // Finally, if invite is a payment link, claim & add as pending transfer
      if (inviteLink.type === "notev2") {
        this.tryClaimPaymentLink(address, inviteLink);
      }
    } catch (e: any) {
      console.error(`[ACCOUNT] createAccount error: ${e}`);
      const retry = () => getAccountManager().createAccount(name, inviteLink);
      this.createAccountHandle = { status: "error", message: e.message, retry };
      this.notifyListeners();
    }
  }

  private setNewAccount(
    enclaveKeyName: string,
    enclavePubKey: Hex,
    name: string,
    address: Address
  ) {
    assert(this.currentAccount == null, "Can't create, have existing account");
    const newAcc = createEmptyAccount(
      {
        enclaveKeyName,
        enclavePubKey,
        name,
        address,
      },
      this.daimoChain
    );
    this.setCurrentAccount(newAcc); // Saves account, notifies listeners
  }

  // Returns a pending claimLink op.
  private async tryClaimPaymentLink(
    address: Address,
    inviteLink: DaimoLinkNoteV2
  ) {
    const rpcFunc = getRpcFunc(this.daimoChain);
    const sanitizedUrl = formatDaimoLink(stripSeedFromNoteLink(inviteLink));

    try {
      console.log(`[ACCOUNT] looking up invite payment link`, inviteLink);
      // TODO: remove this redundant extra roundtrip
      // We already loaded noteStatus earlier.
      const noteStatus = (await rpcFunc.getLinkStatus.query({
        url: sanitizedUrl,
      })) as DaimoNoteStatus;

      console.log(`[ACCOUNT] claiming invite payment link`, inviteLink);
      const txHash = await this.sendClaimPaymentLinkTx(
        address,
        inviteLink,
        noteStatus
      );
      cacheEAccounts([noteStatus.sender]);
      const pendingOp = {
        type: "claimLink",
        amount: Number(dollarsToAmount(inviteLink.dollars)),
        status: OpStatus.pending,
        timestamp: now(),
        from: noteStatus.sender.addr,
        noteStatus,
        to: address,
        txHash,
      } as TransferClog;

      this.transform((a) => ({
        ...a,
        recentTransfers: [...a.recentTransfers, pendingOp],
      }));
    } catch (e: any) {
      console.error(`[ACCOUNT] error claiming invite payment link: ${e}`);
    }
  }

  // Claims a payment link
  private async sendClaimPaymentLinkTx(
    address: Address,
    inviteLink: DaimoLinkNoteV2,
    noteStatus: DaimoNoteStatus
  ) {
    const rpcFunc = getRpcFunc(this.daimoChain);
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
    this.keyInfo.pubKeyHex = undefined;
    this.setCurrentAccount(null);
  }

  // Create a new enclave key, but no account yet.
  async createNewEnclaveKey() {
    assert(this.currentAccount == null, "Can't create, have existing account");
    assert(this.keyInfo?.pubKeyHex == null, "Already have a key");

    this.keyInfo = await loadOrCreateEnclaveKey(defaultEnclaveKeyName);
    console.log(`[ACCOUNT] created enclave key ${this.keyInfo.enclaveKeyName}`);

    this.notifyListeners();
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
export function useAccount(): Account | null {
  const manager = getAccountManager();

  // State + listeners pattern
  const [accState, setAccState] = useState<Account | null>(
    manager.getAccount()
  );
  useEffect(() => {
    manager.addListener(setAccState);
    return () => manager.removeListener(setAccState);
  }, []);

  return accState;
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
