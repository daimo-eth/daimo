import {
  OpStatus,
  TransferOpEvent,
  guessTimestampFromNum,
} from "@daimo/common";
import { daimoChainFromId, erc20ABI } from "@daimo/contract";
import { DaimoNonce } from "@daimo/userop";
import { Address, Hex, Log, getAbiItem, numberToHex } from "viem";

import { OpIndexer } from "./opIndexer";
import { ViemClient, chainConfig } from "../env";

const transferEvent = getAbiItem({ abi: erc20ABI, name: "Transfer" });
export type TransferLog = Log<
  bigint,
  number,
  false,
  typeof transferEvent,
  true
>;

/* USDC or testUSDC stablecoin contract. Tracks transfers. */
export class CoinIndexer {
  private allTransfers: TransferLog[] = [];

  private listeners: ((logs: TransferLog[]) => void)[] = [];

  constructor(private client: ViemClient, private opIndexer: OpIndexer) {}

  async init() {
    await this.client.pipeLogs(
      {
        address: chainConfig.tokenAddress,
        event: transferEvent,
      },
      this.parseLogs
    );
  }

  private parseLogs = (logs: TransferLog[]) => {
    if (logs.length === 0) return;

    this.allTransfers.push(...logs);
    this.listeners.forEach((l) => l(logs));
  };

  /** Get balance as of a block height. */
  async getBalanceAt(addr: Address, blockNum: number) {
    const blockNumber = BigInt(blockNum);
    return this.client.publicClient.readContract({
      abi: erc20ABI,
      address: chainConfig.tokenAddress,
      functionName: "balanceOf",
      args: [addr],
      blockNumber,
    });
  }

  /** Listener invoked for all past coin transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: TransferLog[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new coin transfers. */
  addListener(listener: (logs: TransferLog[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new coin transfers. */
  removeListener(listener: (logs: TransferLog[]) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Returns all transfer events from or to a given address,
   * with fees included and excluding paymaster transfers.
   */
  filterTransfers({
    addr,
    sinceBlockNum,
    txHashes,
  }: {
    addr: Address;
    sinceBlockNum?: bigint;
    txHashes?: Hex[];
  }): TransferOpEvent[] {
    let relevantTransfers = this.allTransfers.filter(
      (log) => log.args.from === addr || log.args.to === addr
    );
    if (sinceBlockNum) {
      relevantTransfers = relevantTransfers.filter(
        (log) => (log.blockNumber || 0n) >= sinceBlockNum
      );
    }
    if (txHashes !== undefined) {
      relevantTransfers = relevantTransfers.filter((log) =>
        txHashes.includes(log.transactionHash || "0x")
      );
    }

    const transferOpsIncludingPaymaster = relevantTransfers.map((log) =>
      this.attachTransferOpProperties(log)
    );

    const transferOps = this.attachFeeAmounts(transferOpsIncludingPaymaster);

    return transferOps;
  }

  /* Populates atomic properties of logs to convert it Op Event.
   * Does not account for fees since they involve multiple logs.
   */
  private attachTransferOpProperties(log: TransferLog): TransferOpEvent {
    const { blockNumber, blockHash, logIndex, transactionHash } = log;
    const { from, to, value } = log.args;
    const userOp = this.opIndexer.fetchUserOpLog(transactionHash, logIndex);
    const opHash = userOp?.args.userOpHash;
    const nonceMetadata = userOp
      ? DaimoNonce.fromHex(
          numberToHex(userOp.args.nonce, { size: 32 })
        )?.metadata.toHex()
      : undefined;

    return {
      type: "transfer",
      status: OpStatus.confirmed,
      timestamp: guessTimestampFromNum(
        Number(blockNumber),
        daimoChainFromId(chainConfig.chainL2.id)
      ),
      from,
      to,
      amount: Number(value),
      blockNumber: Number(blockNumber),

      blockHash,
      txHash: transactionHash,
      logIndex,
      nonceMetadata,
      opHash,
    };
  }

  /* Attach fee amounts to transfer ops and filter out transfers involving
   * paymaster.
   * TODO: unit test this function
   */
  private attachFeeAmounts(
    transferOpsIncludingPaymaster: TransferOpEvent[]
  ): TransferOpEvent[] {
    // Map of opHash to fee amount paid to paymaster address
    const opHashToFee = new Map<Hex, number>();
    for (const op of transferOpsIncludingPaymaster) {
      if (op.opHash === undefined) continue;

      const prevFee = opHashToFee.get(op.opHash) || 0;

      if (op.to === chainConfig.pimlicoPaymasterAddress) {
        opHashToFee.set(op.opHash, prevFee + op.amount);
      } else if (op.from === chainConfig.pimlicoPaymasterAddress) {
        // Account for fee refund
        opHashToFee.set(op.opHash, prevFee - op.amount);
      }
    }

    const transferOps = transferOpsIncludingPaymaster
      .filter(
        // Remove paymaster logs
        (op) =>
          op.from !== chainConfig.pimlicoPaymasterAddress &&
          op.to !== chainConfig.pimlicoPaymasterAddress
      )
      .map((op) => {
        // Attach fee amounts to other transfers
        return {
          ...op,
          feeAmount: opHashToFee.get(op.opHash!) || 0,
        };
      });

    return transferOps;
  }
}
