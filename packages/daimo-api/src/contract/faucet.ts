import { testUsdcConfig } from "@daimo/contract";
import {
  Account,
  Address,
  BlockTag,
  Chain,
  Log,
  Transport,
  WalletClient,
  getAbiItem,
  getContract,
} from "viem";

import { ClientsType, ContractType, getClients } from "../chain";

export type FaucetStatus =
  | "unavailable"
  | "canRequest"
  | "alreadyRequested"
  | "alreadySent";

const transferEvent = getAbiItem({ abi: testUsdcConfig.abi, name: "Transfer" });
type TransferLog = Log<bigint, number, typeof transferEvent>;

/** Testnet faucet. Drips testUSDC to any account not yet requested. */
export class Faucet {
  requested = new Set<Address>();
  sent = new Set<Address>();
  clients: ClientsType;
  contract: ContractType<typeof testUsdcConfig.abi>;

  constructor(walletClient: WalletClient<Transport, Chain, Account>) {
    this.clients = getClients(walletClient);
    this.contract = getContract({ ...testUsdcConfig, ...this.clients });
  }

  async init() {
    const logs = await this.clients.publicClient.getLogs({
      ...testUsdcConfig,
      event: transferEvent,
      fromBlock: 0n,
      toBlock: "latest" as BlockTag,
    });
    console.log(`[FAUCET] init, read ${logs.length} logs`);

    this.parseLogs(logs);
  }

  parseLogs(logs: TransferLog[]) {
    for (const log of logs) {
      const { from, to } = log.args;
      if (to != null && from === this.clients.walletClient.account.address) {
        this.sent.add(to);
      }
    }
  }

  getStatus(address: Address): FaucetStatus {
    if (!this.clients.walletClient.chain.testnet) return "unavailable";
    if (this.sent.has(address)) return "alreadySent";
    if (this.requested.has(address)) return "alreadyRequested";
    return "canRequest";
  }

  async request(address: Address): Promise<void> {
    const status = this.getStatus(address);
    if (status !== "canRequest") throw new Error(status);

    this.requested.add(address);

    console.log(`[FAUCET] sending 50 testUSDC to ${address}`);
    const hash = await this.contract.write.transfer([address, 50_000_000n]);

    // TODO: factor out transaction tracking. Track speed and reliability.
    const { publicClient } = this.clients;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      `[FAUCET] sent 50 testUSDC to ${address}. ${receipt.status}: ${hash}`
    );

    if (receipt.status === "success") this.sent.add(address);
    else throw new Error(`transfer reverted: ${hash}`);
  }
}
