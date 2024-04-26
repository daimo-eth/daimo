import {
  DisplayOpEvent,
  amountToDollars,
  formatDaimoLink,
  getAccountName,
  getForeignCoinDisplayAmount,
} from "@daimo/common";
import {
  daimoPaymasterV2ABI,
  daimoPaymasterV2Address,
  entryPointABI,
  erc20ABI,
} from "@daimo/contract";
import { CronJob } from "cron";
import { Constants } from "userop";
import { Hex, formatEther, getAddress } from "viem";

import { Telemetry } from "./telemetry";
import {
  ForeignCoinIndexer,
  ForeignTokenTransfer,
} from "../contract/foreignCoinIndexer";
import { HomeCoinIndexer, Transfer } from "../contract/homeCoinIndexer";
import { NameRegistry } from "../contract/nameRegistry";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";

export class Crontab {
  private cronJobs: CronJob[] = [];

  constructor(
    private vc: ViemClient,
    private homeCoinIndexer: HomeCoinIndexer,
    private foreignCoinIndexer: ForeignCoinIndexer,
    private nameRegistry: NameRegistry,
    private telemetry: Telemetry
  ) {}

  async init() {
    this.cronJobs = [
      new CronJob("*/5 * * * *", () => this.checkPaymasterDeposit()),
      new CronJob("*/5 * * * *", () => this.checkFaucetBalance()),
      new CronJob("*/1 * * * *", () => this.printStatus()),
    ];
    this.homeCoinIndexer.addListener(this.pipeTransfers);
    this.foreignCoinIndexer.addListener(this.pipeForeignCoinTransfers);

    this.cronJobs.forEach((job) => job.start());
  }

  private printStatus() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const homeCoinIndexer = this.homeCoinIndexer.status();
    const nameRegistry = this.nameRegistry.status();
    const status = {
      mem,
      cpu,
      homeCoinIndexer,
      nameRegistry,
    };
    console.log(`[CRON] status: ${JSON.stringify(status)}`);
  }

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
    const metaPaymaster = await this.vc.publicClient.readContract({
      address: daimoPaymasterV2Address,
      abi: daimoPaymasterV2ABI,
      functionName: "metaPaymaster",
    });

    const isMetaPaymasterEnabled =
      getAddress(metaPaymaster) !==
      getAddress("0x0000000000000000000000000000000000000000");

    console.log(`[CRON] checked meta paymaster ${isMetaPaymasterEnabled}`);

    const depositInfo = await this.vc.publicClient.readContract({
      address: Constants.ERC4337.EntryPoint as Hex,
      abi: entryPointABI,
      functionName: "getDepositInfo",
      args: [daimoPaymasterV2Address],
    });

    const depositEth = Number(formatEther(depositInfo.deposit));
    console.log(`[CRON] checked paymaster deposit ${depositEth}`);

    await this.sendLowBalanceMessage(
      depositEth,
      `Paymaster ${daimoPaymasterV2Address} ETH`,
      isMetaPaymasterEnabled ? 0.01 : 0.15,
      isMetaPaymasterEnabled ? 0.005 : 0.05
    );
  }

  async checkFaucetBalance() {
    const faucetAddr = this.vc.account.address;
    const balance = await this.vc.publicClient.getBalance({
      address: faucetAddr,
    });
    const balanceEth = Number(formatEther(balance));
    console.log(`[CRON] checked faucet ETH balance ${balanceEth}`);

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
    console.log(`[CRON] checked faucet USDC balance ${balanceDollars}`);

    await this.sendLowBalanceMessage(
      balanceDollars,
      `Faucet ${faucetAddr} USDC`,
      250,
      25
    );
  }

  private pipeTransfers = (logs: Transfer[]) => {
    for (const transfer of logs) {
      const opEvent = this.homeCoinIndexer.attachTransferOpProperties(transfer);
      this.postRecentTransfer(opEvent);
    }
  };

  private pipeForeignCoinTransfers = (logs: ForeignTokenTransfer[]) => {
    for (const transfer of logs) {
      this.postRecentForeignCoinTransfer(transfer);
    }
  };

  async postRecentTransfer(opEvent: DisplayOpEvent) {
    const fromName = this.nameRegistry.resolveDaimoNameForAddr(opEvent.from);
    const toName = this.nameRegistry.resolveDaimoNameForAddr(opEvent.to);

    if (fromName == null && toName == null) return;

    const fromDisplayName = getAccountName(
      await this.nameRegistry.getEAccount(opEvent.from)
    );
    const toDisplayName = getAccountName(
      await this.nameRegistry.getEAccount(opEvent.to)
    );

    this.telemetry.recordClippy(
      `Transfer: ${fromDisplayName} -> ${toDisplayName} $${amountToDollars(
        opEvent.amount
      )}${
        opEvent.type === "transfer" && opEvent.requestStatus
          ? " for " + formatDaimoLink(opEvent.requestStatus.link)
          : ""
      }${
        opEvent.type === "transfer" && opEvent.memo ? " : " + opEvent.memo : ""
      }`
    );
  }

  async postRecentForeignCoinTransfer(transfer: ForeignTokenTransfer) {
    const fromName = this.nameRegistry.resolveDaimoNameForAddr(transfer.from);
    const toName = this.nameRegistry.resolveDaimoNameForAddr(transfer.to);

    if (fromName == null && toName == null) return;

    const fromDisplayName = getAccountName(
      await this.nameRegistry.getEAccount(transfer.from)
    );
    const toDisplayName = getAccountName(
      await this.nameRegistry.getEAccount(transfer.to)
    );

    const humanReadableValue = getForeignCoinDisplayAmount(
      transfer.value.toString() as `${bigint}`,
      transfer.foreignToken
    );
    this.telemetry.recordClippy(
      `Forex Transfer: ${fromDisplayName} -> ${toDisplayName} ${humanReadableValue} ${transfer.foreignToken.symbol} `
    );
  }
}
