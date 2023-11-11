import { OpStatus, TransferOpEvent, dollarsToAmount } from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { generateSlug } from "random-word-slugs";
import { Address } from "viem";

import { CoinIndexer, TransferLog } from "./coinIndexer";
import { DB } from "../db/db";
import { ViemClient, chainConfig } from "../env";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequested"
  | "alreadySentInvite"
  | "alreadySentAddress";

type InviteCodeStatus = {
  useCount: number;
  maxUses: number;
};

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  private requested = new Set<Address>();
  private sent = new Set<Address>();
  private inviteCodes = new Map<string, InviteCodeStatus>();

  constructor(
    private vc: ViemClient,
    private coinIndexer: CoinIndexer,
    private db: DB
  ) {}

  async init() {
    this.coinIndexer.pipeAllTransfers(this.parseLogs);

    const rows = await this.db.loadInviteCodes();
    console.log(`[PUSH] loaded ${rows.length} push tokens from DB`);
    for (const row of rows) {
      this.cacheInviteCode(row.code, {
        useCount: row.useCount,
        maxUses: row.maxUses,
      });
    }
  }

  parseLogs = (logs: TransferLog[]) => {
    for (const log of logs) {
      const { from, to } = log.args;
      if (to != null && from === this.vc.walletClient.account.address) {
        this.sent.add(to);
      }
    }
  };

  cacheInviteCode(code: string, status: InviteCodeStatus) {
    this.inviteCodes.set(code, status);
  }

  verifyInviteCode(invCode: string): boolean {
    if (!this.inviteCodes.has(invCode)) return false;
    const { useCount, maxUses } = this.inviteCodes.get(invCode)!;
    if (useCount >= maxUses) return false;
    return true;
  }

  getStatus(address: Address, invCode: string): FaucetStatus {
    if (!this.verifyInviteCode(invCode)) return "alreadySentInvite";

    if (this.sent.has(address)) return "alreadySentAddress";
    if (this.requested.has(address)) return "alreadyRequested";
    return "canRequest";
  }

  async incrementInviteCodeUseCount(code: string) {
    await this.db.incrementInviteCodeUseCount(code);
    this.inviteCodes.get(code)!.useCount += 1;
  }

  async saveInviteCode(code: string, status: InviteCodeStatus) {
    await this.db.saveInviteCode({ code, ...status });
    this.inviteCodes.set(code, status);
  }

  async createInviteCode(maxUses: number): Promise<string> {
    const code = generateSlug(2, {
      partsOfSpeech: ["adjective", "noun"],
    }).toLowerCase();
    await this.saveInviteCode(code, { useCount: 0, maxUses });
    return code;
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
    const hash = await this.vc.walletClient.writeContract({
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
