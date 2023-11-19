import { OpStatus, TransferOpEvent, dollarsToAmount } from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { generateSlug } from "random-word-slugs";
import { Address } from "viem";

import { CoinIndexer, TransferLog } from "./coinIndexer";
import { DB } from "../db/db";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequestedCoins"
  | "alreadyUsedInvite"
  | "alreadySentCoins";

type InviteCodeStatus = {
  useCount: number;
  maxUses: number;
};

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  private requested = new Set<Address>();
  private sent = new Set<Address>();
  private inviteCodes = new Map<string, InviteCodeStatus>();
  private zupassEmailToInviteCode = new Map<string, string>();

  constructor(
    private vc: ViemClient,
    private coinIndexer: CoinIndexer,
    private db: DB
  ) {}

  async init() {
    const rows = await this.db.loadInviteCodes();
    console.log(`[FAUCET] loaded ${rows.length} invites from DB`);
    for (const row of rows) {
      this.cacheInviteCode(row.code, row.zupassEmail, {
        useCount: row.useCount,
        maxUses: row.maxUses,
      });
    }

    this.coinIndexer.pipeAllTransfers(this.parseLogs);
  }

  parseLogs = (logs: TransferLog[]) => {
    for (const log of logs) {
      const { from, to } = log.args;
      if (to != null && from === this.vc.walletClient.account.address) {
        this.sent.add(to);
      }
    }
  };

  cacheInviteCode(
    code: string,
    zupassEmail: string | null,
    status: InviteCodeStatus
  ) {
    console.log("[FAUCET] caching invite", code, zupassEmail, status);
    this.inviteCodes.set(code, status);
    if (zupassEmail) {
      this.zupassEmailToInviteCode.set(zupassEmail, code);
    }
  }

  verifyInviteCode(invCode: string): boolean {
    if (!this.inviteCodes.has(invCode)) return false;
    const { useCount, maxUses } = this.inviteCodes.get(invCode)!;
    if (useCount >= maxUses) return false;
    return true;
  }

  async incrementInviteCodeUseCount(code: string) {
    await this.db.incrementInviteCodeUseCount(code);
    this.inviteCodes.get(code)!.useCount += 1;
  }

  async saveInviteCode(
    code: string,
    zupassEmail: string | null,
    status: InviteCodeStatus
  ) {
    await this.db.saveInviteCode({ code, zupassEmail, ...status });
    this.cacheInviteCode(code, zupassEmail, {
      useCount: status.useCount,
      maxUses: status.maxUses,
    });
  }

  async createInviteCode(
    zupassEmail: string | null,
    maxUses: number
  ): Promise<string> {
    // Generate an unused random invite code
    let code: string;
    do {
      code = generateSlug(2, {
        partsOfSpeech: ["adjective", "noun"],
      }).toLowerCase();
    } while (this.inviteCodes.has(code));

    await this.saveInviteCode(code, zupassEmail, { useCount: 0, maxUses });
    return code;
  }

  async getOrCreateZupassInviteCode(zupassEmail: string): Promise<string> {
    if (!this.zupassEmailToInviteCode.has(zupassEmail)) {
      return await this.createInviteCode(zupassEmail, 1);
    } else {
      return this.zupassEmailToInviteCode.get(zupassEmail)!;
    }
  }

  getStatus(address: Address, invCode: string): FaucetStatus {
    return "unavailable";
    // if (!this.verifyInviteCode(invCode)) return "alreadyUsedInvite";

    // if (this.sent.has(address)) return "alreadySentCoins";
    // if (this.requested.has(address)) return "alreadyRequestedCoins";
    // return "canRequest";
  }

  async request(
    address: Address,
    dollars: number,
    invCode: string
  ): Promise<TransferOpEvent> {
    const status = this.getStatus(address, invCode);
    if (status !== "canRequest") throw new Error(status);

    this.requested.add(address);
    await this.incrementInviteCodeUseCount(invCode);

    console.log(`[FAUCET] sending $${dollars} USDC to ${address}`);
    const hash = await this.vc.writeContract({
      abi: erc20ABI,
      address: chainConfig.tokenAddress,
      functionName: "transfer",
      args: [address, dollarsToAmount(dollars)],
    });

    return {
      type: "transfer",
      amount: Number(dollarsToAmount(dollars)),
      from: this.vc.walletClient.account.address,
      to: address,
      timestamp: Math.floor(Date.now() / 1e3),
      status: OpStatus.pending,
      txHash: hash,
      nonceMetadata: undefined,
    };
  }
}
