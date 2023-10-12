import { OpStatus, TransferOpEvent } from "@daimo/common";
import { erc20ABI, tokenMetadata } from "@daimo/contract";
import { Address } from "viem";

import { CoinIndexer, TransferLog } from "./coinIndexer";
import { ViemClient } from "../chain";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequested"
  | "alreadySent";

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  private requested = new Set<Address>();
  private sent = new Set<Address>();

  constructor(private vc: ViemClient, private coinIndexer: CoinIndexer) {}

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

  getStatus(address: Address): FaucetStatus {
    if (!this.vc.walletClient.chain.testnet) return "unavailable";
    if (this.sent.has(address)) return "alreadySent";
    if (this.requested.has(address)) return "alreadyRequested";
    return "canRequest";
  }

  async request(address: Address): Promise<TransferOpEvent> {
    const status = this.getStatus(address);
    if (status !== "canRequest") throw new Error(status);

    this.requested.add(address);

    console.log(`[FAUCET] sending 50 testUSDC to ${address}`);
    const amount = 50_000_000n;
    const hash = await this.vc.walletClient.writeContract({
      abi: erc20ABI,
      address: tokenMetadata.address,
      functionName: "transfer",
      args: [address, amount],
    });

    return {
      type: "transfer",
      amount: Number(amount),
      from: this.vc.walletClient.account.address,
      to: address,
      timestamp: Math.floor(Date.now() / 1e3),
      status: OpStatus.pending,
      txHash: hash,
      nonceMetadata: undefined,
    };
  }
}
