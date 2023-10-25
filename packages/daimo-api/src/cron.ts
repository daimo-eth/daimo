import {
  amountToDollars,
  getAccountName,
  guessTimestampFromNum,
} from "@daimo/common";
import {
  daimoChainFromId,
  daimoPaymasterAddress,
  entryPointABI,
} from "@daimo/contract";
import { CronJob } from "cron";
import { Constants } from "userop";
import { Hex, formatEther } from "viem";

import { CoinIndexer, TransferLog } from "./contract/coinIndexer";
import { NameRegistry } from "./contract/nameRegistry";
import { ViemClient, chainConfig } from "./env";
import { Telemetry } from "./telemetry";

export class Crontab {
  private transfersQueue: TransferLog[] = [];
  private cronJobs: CronJob[] = [];

  constructor(
    private vc: ViemClient,
    private coinIndexer: CoinIndexer,
    private nameRegistry: NameRegistry,
    private telemetry: Telemetry
  ) {}

  async init() {
    this.coinIndexer.pipeAllTransfers(this.pipeTransfers);
    this.cronJobs = [
      new CronJob("*/5 * * * *", () => this.checkPaymasterDeposit()), // Every 5 minutes
      new CronJob("*/5 * * * *", () => this.postRecentTransfers()), // Every 5 minutes
    ];

    this.cronJobs.forEach((job) => job.start());
  }

  private pruneTransfers = () => {
    this.transfersQueue = this.transfersQueue.filter(
      (log) =>
        guessTimestampFromNum(
          log.blockNumber,
          daimoChainFromId(chainConfig.chainL2.id)
        ) *
          1000 >
        Date.now() - 1000 * 60 * 5 // Only keep 5 minutes of logs
    );
  };

  private pipeTransfers = (logs: TransferLog[]) => {
    this.transfersQueue.push(...logs);
    this.pruneTransfers();
  };

  async checkPaymasterDeposit() {
    const depositInfo = await this.vc.publicClient.readContract({
      address: Constants.ERC4337.EntryPoint as Hex,
      abi: entryPointABI,
      functionName: "getDepositInfo",
      args: [daimoPaymasterAddress],
    });

    const depositEth = Number(formatEther(depositInfo.deposit));
    console.log(`[CRON] checked paymaster deposit ${depositEth}`);

    if (depositEth < 0.001) {
      this.telemetry.recordClippy(
        `Paymaster deposit too low: ${depositEth} eth`,
        "error"
      );
    } else if (depositEth < 0.01) {
      this.telemetry.recordClippy(
        `Paymaster deposit low: ${depositEth} eth`,
        "warn"
      );
    }
  }

  async postRecentTransfers() {
    this.pruneTransfers();
    for (const transfer of this.transfersQueue) {
      const fromName = this.nameRegistry.resolveDaimoNameForAddr(
        transfer.args.from
      );
      const toName = this.nameRegistry.resolveDaimoNameForAddr(
        transfer.args.to
      );

      if (fromName == null && toName == null) continue;

      const fromDisplayName = getAccountName(
        await this.nameRegistry.getEAccount(transfer.args.from)
      );
      const toDisplayName = getAccountName(
        await this.nameRegistry.getEAccount(transfer.args.to)
      );

      this.telemetry.recordClippy(
        `Transfer: ${fromDisplayName} -> ${toDisplayName} $${amountToDollars(
          transfer.args.value
        )}`
      );
    }
  }
}
