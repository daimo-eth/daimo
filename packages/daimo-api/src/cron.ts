import {
  amountToDollars,
  getAccountName,
  guessTimestampFromNum,
} from "@daimo/common";
import {
  daimoChainFromId,
  daimoPaymasterAddress,
  entryPointABI,
  erc20ABI,
} from "@daimo/contract";
import { CronJob } from "cron";
import { Constants } from "userop";
import { Hex, formatEther } from "viem";

import { CoinIndexer, TransferLog } from "./contract/coinIndexer";
import { NameRegistry } from "./contract/nameRegistry";
import { ViemClient } from "./network/viemClient";
import { chainConfig } from "./env";
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
      new CronJob("*/5 * * * *", () => this.checkFaucetBalance()), // Every 5 minutes
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
    this.transfersQueue = this.transfersQueue.concat(logs);
    this.pruneTransfers();
  };

  async sendLowBalanceMessage(
    balance: number,
    label: string,
    thresholdWarn: number,
    thresholdError: number
  ) {
    if (balance < thresholdError) {
      this.telemetry.recordClippy(
        `${label} balance too low: ${balance}`,
        "error"
      );
    } else if (balance < thresholdWarn) {
      this.telemetry.recordClippy(`${label} balance low: ${balance}`, "warn");
    }
  }

  async checkPaymasterDeposit() {
    const depositInfo = await this.vc.publicClient.readContract({
      address: Constants.ERC4337.EntryPoint as Hex,
      abi: entryPointABI,
      functionName: "getDepositInfo",
      args: [daimoPaymasterAddress],
    });

    const depositEth = Number(formatEther(depositInfo.deposit));
    console.log(`[CRON] checked paymaster deposit ${depositEth}`);

    await this.sendLowBalanceMessage(
      depositEth,
      `Paymaster ${daimoPaymasterAddress} ETH`,
      0.05,
      0.005
    );
  }

  async checkFaucetBalance() {
    const faucetAddr = this.vc.walletClient.account.address;
    const balance = await this.vc.publicClient.getBalance({
      address: faucetAddr,
    });
    const balanceEth = Number(formatEther(balance));
    await this.sendLowBalanceMessage(
      balanceEth,
      `Faucet ${faucetAddr} ETH`,
      0.05,
      0.005
    );

    const balanceUSDC = await this.vc.publicClient.readContract({
      abi: erc20ABI,
      address: chainConfig.tokenAddress,
      functionName: "balanceOf",
      args: [faucetAddr],
    });
    const balanceDollars = Number(amountToDollars(balanceUSDC));

    await this.sendLowBalanceMessage(
      balanceDollars,
      `Faucet ${faucetAddr} USDC`,
      200,
      20
    );
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
