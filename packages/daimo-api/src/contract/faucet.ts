import { OpStatus, TransferOpEvent } from "@daimo/common";
import { erc20ABI, tokenMetadata } from "@daimo/contract";
import { Address, Log, getAbiItem, getContract } from "viem";

import { CoinIndexer } from "./coinIndexer";
import { ContractType, ViemClient } from "../chain";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequested"
  | "alreadySent";

const transferEvent = getAbiItem({ abi: erc20ABI, name: "Transfer" });
type TransferLog = Log<bigint, number, typeof transferEvent>;

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  private requested = new Set<Address>();
  private sent = new Set<Address>();
  private contract: ContractType<typeof erc20ABI>;

  constructor(private vc: ViemClient, private coinIndexer: CoinIndexer) {
    const { address } = tokenMetadata;
    this.contract = getContract({ abi: erc20ABI, address, ...this.vc });
  }

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
    const hash = await this.contract.write.transfer([address, amount]);

    return {
      type: "transfer",
      amount: Number(amount),
      from: this.vc.walletClient.account.address,
      to: address,
      timestamp: Math.floor(Date.now() / 1e3),
      status: OpStatus.pending,
      txHash: hash,
    };

    // TODO: factor out transaction tracking. Track speed and reliability.
    // const { publicClient } = this.vc;
    // const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // console.log(
    //   `[FAUCET] sent 50 testUSDC to ${address}. ${receipt.status}: ${hash}`
    // );

    // if (receipt.status === "success") this.sent.add(address);
    // else throw new Error(`transfer reverted: ${hash}`);
  }
}
