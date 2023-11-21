import { OpStatus, TransferOpEvent, dollarsToAmount } from "@daimo/common";
import { erc20ABI } from "@daimo/contract";
import { Address } from "viem";

import { CoinIndexer, TransferLog } from "./coinIndexer";
import { DB } from "../db/db";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequestedCoins"
  | "alreadySentCoins";

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  private requested = new Set<Address>();
  private sent = new Set<Address>();

  constructor(
    private vc: ViemClient,
    private coinIndexer: CoinIndexer,
    private db: DB
  ) {}

  async init() {
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

  async useInviteCode(invCode: string): Promise<boolean> {
    if (chainConfig.chainL2.testnet && invCode === "testnet") return true;

    await this.db.incrementInviteCodeUseCount(invCode);
    const code = await this.db.loadInviteCode(invCode);
    return code != null && code.useCount <= code.maxUses;
  }

  async verifyInviteCode(invCode: string): Promise<boolean> {
    const code = await this.db.loadInviteCode(invCode);
    if (code == null) return false;
    const { useCount, maxUses } = code;
    if (useCount >= maxUses) return false;
    return true;
  }

  getStatus(address: Address): FaucetStatus {
    if (this.sent.has(address)) return "alreadySentCoins";
    if (this.requested.has(address)) return "alreadyRequestedCoins";
    return "canRequest";
  }

  async request(address: Address, dollars: number): Promise<TransferOpEvent> {
    const status = this.getStatus(address);
    if (status !== "canRequest") throw new Error(status);

    this.requested.add(address);

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
