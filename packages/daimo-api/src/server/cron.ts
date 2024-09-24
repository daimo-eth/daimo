import {
  EAccount,
  TransferClog,
  amountToDollars,
  assert,
  formatDaimoLink,
  getAccountName,
  getForeignCoinDisplayAmount,
  getTransferSummary,
} from "@daimo/common";
import {
  daimoPaymasterV2Address,
  entryPointV06Abi,
  entryPointV06Address,
  erc20Abi,
} from "@daimo/contract";
import { CronJob } from "cron";
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
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";
import { InviteGraph } from "../offchain/inviteGraph";

export class Crontab {
  private cronJobs: CronJob[] = [];

  constructor(
    private vc: ViemClient,
    private homeCoinIndexer: HomeCoinIndexer,
    private foreignCoinIndexer: ForeignCoinIndexer,
    private inviteCodeTracker: InviteCodeTracker,
    private inviteGraph: InviteGraph,
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
    const depositInfo = await this.vc.publicClient.readContract({
      address: entryPointV06Address as Hex,
      abi: entryPointV06Abi,
      functionName: "getDepositInfo",
      args: [daimoPaymasterV2Address],
    });

    const depositEth = Number(formatEther(depositInfo.deposit));
    console.log(`[CRON] checked paymaster deposit ${depositEth}`);

    await this.sendLowBalanceMessage(
      depositEth,
      `Paymaster ${daimoPaymasterV2Address} ETH`,
      0.15,
      0.05
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
      abi: erc20Abi,
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
      const fromName = this.nameRegistry.resolveDaimoNameForAddr(transfer.from);
      const toName = this.nameRegistry.resolveDaimoNameForAddr(transfer.to);
      if (fromName == null && toName == null) return;

      const acct = getAddress(fromName == null ? transfer.to : transfer.from);
      const opEvent = this.homeCoinIndexer.createTransferClog(transfer, acct);
      this.postRecentTransfer(opEvent, fromName, toName);
    }
  };

  private pipeForeignCoinTransfers = (logs: ForeignTokenTransfer[]) => {
    for (const transfer of logs) {
      this.postRecentForeignCoinTransfer(transfer);
    }
  };

  async postRecentTransfer(
    opEvent: TransferClog,
    fromName?: string,
    toName?: string
  ) {
    assert(fromName != null || toName != null);

    const [fromAcc, toAcc] = await Promise.all([
      this.nameRegistry.getEAccount(opEvent.from),
      this.nameRegistry.getEAccount(opEvent.to),
    ]);

    const getAccountInfo = async (acc: EAccount) => {
      const invitees = this.inviteGraph.getInvitees(acc.addr);
      const inviteCode =
        await this.inviteCodeTracker.getBestInviteCodeForSender(acc.addr);
      const inviteStatus = inviteCode
        ? await this.inviteCodeTracker.getInviteCodeStatus({
            type: "invite",
            code: inviteCode,
          })
        : undefined;

      return `${getAccountName(acc)} (${invitees.length} invitees, ${
        inviteStatus?.usesLeft || 0
      } available)`;
    };

    const opSummary = getTransferSummary(opEvent, chainConfig);

    // Post to Clippy
    const parts = [
      "Transfer:",
      await getAccountInfo(fromAcc),
      "->",
      await getAccountInfo(toAcc),
      "$" + amountToDollars(opEvent.amount),
      opEvent.type === "transfer" &&
        opEvent.requestStatus &&
        `for ${formatDaimoLink(opEvent.requestStatus.link)}`,
      opSummary && `: ${opSummary}`,
      opEvent.blockNumber != null &&
        opEvent.logIndex != null &&
        `https://ethreceipts.org/l/${chainConfig.chainL2.id}/${opEvent.blockNumber}/${opEvent.logIndex}`,
    ];
    const clippyMessage = parts.filter(Boolean).join(" ");
    this.telemetry.recordClippy(clippyMessage);
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
