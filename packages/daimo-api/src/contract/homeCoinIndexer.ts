import {
  TransferClog,
  OpStatus,
  PaymentLinkClog,
  SimpleTransferClog,
  guessTimestampFromNum,
  SwapClog,
} from "@daimo/common";
import { DaimoNonce } from "@daimo/userop";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress, numberToHex } from "viem";

import { ForeignCoinIndexer } from "./foreignCoinIndexer";
import { Indexer } from "./indexer";
import { NoteIndexer } from "./noteIndexer";
import { OpIndexer } from "./opIndexer";
import { RequestIndexer } from "./requestIndexer";
import { SwapClogMatcher } from "./SwapClogMatcher";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";
import { retryBackoff } from "../utils/retryBackoff";

export interface Transfer {
  address: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  transactionIndex: number;
  logIndex: number;
  from: Address;
  to: Address;
  value: bigint;
}

/* USDC or testUSDC stablecoin contract. Tracks transfers. */
export class HomeCoinIndexer extends Indexer {
  private allTransfers: Transfer[] = [];
  private currentBalances: Map<Address, bigint> = new Map();

  private listeners: ((transfers: Transfer[]) => void)[] = [];

  constructor(
    private client: ViemClient,
    private opIndexer: OpIndexer,
    private noteIndexer: NoteIndexer,
    private requestIndexer: RequestIndexer,
    private foreignCoinIndexer: ForeignCoinIndexer,
    private paymentMemoTracker: PaymentMemoTracker,
    private swapClogMatcher: SwapClogMatcher
  ) {
    super("COIN");
  }

  public status() {
    return { numTransfers: this.allTransfers.length };
  }

  async load(pg: Pool, from: number, to: number) {
    const startTime = Date.now();

    const result = await retryBackoff(
      `homeCoinIndexer-logs-query-${from}-${to}`,
      () =>
        pg.query(
          `
        select
          block_num,
          block_hash,
          tx_hash,
          tx_idx,
          log_idx,
          log_addr,
          f as "from",
          t as "to",
          v as "value"
        from transfers
        where (
          block_num >= $1
          and block_num <= $2
        )
        and (
          f in (select addr from "names")
          or t in (select addr from "names")
        );
      `,
          [from, to]
        )
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const logs: Transfer[] = result.rows.map((row) => {
      return {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: row.tx_idx,
        logIndex: row.log_idx,
        address: getAddress(bytesToHex(row.log_addr, { size: 20 })),
        from: getAddress(bytesToHex(row.from, { size: 20 })),
        to: getAddress(bytesToHex(row.to, { size: 20 })),
        value: BigInt(row.value),
      };
    });
    if (logs.length === 0) return;
    console.log(
      `[COIN] loaded ${logs.length} transfers ${from} ${to} in ${
        Date.now() - startTime
      }ms`
    );

    this.allTransfers = this.allTransfers.concat(logs);
    logs.forEach((t) => {
      this.updateCurrentBalance(t.from, -t.value);
      this.updateCurrentBalance(t.to, t.value);
    });

    this.listeners.forEach((l) => l(logs));
  }

  updateCurrentBalance(addr: Address, delta: bigint) {
    const currentBalance = this.currentBalances.get(addr) || 0n;
    this.currentBalances.set(addr, currentBalance + delta);
  }

  /** Get balance as of current shovel sync. */
  getCurrentBalance(addr: Address) {
    return this.currentBalances.get(addr) || 0n;
  }

  /** Listener invoked for all past coin transfers, then for new ones. */
  pipeAllTransfers(listener: (logs: Transfer[]) => void) {
    listener(this.allTransfers);
    this.addListener(listener);
  }

  /** Listener is invoked for all new coin transfers. */
  addListener(listener: (logs: Transfer[]) => void) {
    this.listeners.push(listener);
  }

  /** Unsubscribe from new coin transfers. */
  removeListener(listener: (logs: Transfer[]) => void) {
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
  }): TransferClog[] {
    let relevantTransfers = this.allTransfers.filter(
      (log) => log.from === addr || log.to === addr
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

  /* Populates atomic properties of logs to convert it to an Op Event.
   * Does not account for fees since they involve multiple transfer logs.
   *
   * Coalesced logs can be attributed to a simple transfer (same coin, same
   * chain), swap (different coins, same chain), or payment link.
   */
  attachTransferOpProperties(log: Transfer): TransferClog {
    const {
      blockNumber,
      blockHash,
      logIndex,
      transactionHash,
      from,
      to,
      value,
    } = log;
    const userOp = this.opIndexer.fetchUserOpLog(transactionHash, logIndex);
    const opHash = userOp?.hash;
    const nonceMetadata = userOp
      ? DaimoNonce.fromHex(
          numberToHex(userOp.nonce, { size: 32 })
        )?.metadata.toHex()
      : undefined;
    const noteInfo = this.noteIndexer.getNoteStatusbyLogCoordinate(
      transactionHash,
      logIndex - 1
    );

    const requestStatus =
      this.requestIndexer.getRequestStatusByFulfillLogCoordinate(
        transactionHash,
        logIndex - 1
      );

    const memo = opHash ? this.paymentMemoTracker.getMemo(opHash) : undefined;

    // If inbound swap, attach logical origin info to create a swapClog.
    const correspondingForeignReceive =
      this.foreignCoinIndexer.getForeignTokenReceiveForSwap(
        to,
        transactionHash
      );
    const swapClogInbound = correspondingForeignReceive
      ? {
          coinOther: correspondingForeignReceive.foreignToken,
          amountOther: `${correspondingForeignReceive.value}` as `${bigint}`,
        }
      : undefined;

    // If outbound swap, attach logical outbound info to create a swapClog.
    // use userop to get the transfer log
    const correspondingForeignSend =
      this.swapClogMatcher.getMatchingSwapTransfer(from, transactionHash);
    const swapClogOutbound = correspondingForeignSend
      ? {
          coinOther: correspondingForeignSend.foreignToken,
          amountOther: `${correspondingForeignSend.value}` as `${bigint}`,
        }
      : undefined;
    // Foreign receive and foreign send are mutually exclusive.
    const outboundTo = correspondingForeignReceive
      ? null
      : correspondingForeignSend?.to;

    // Base clog info (same for all TransferClog types).
    const partialClog = {
      status: OpStatus.confirmed,
      timestamp: guessTimestampFromNum(
        Number(blockNumber),
        chainConfig.daimoChain
      ),

      amount: Number(value),
      from: getAddress(correspondingForeignReceive?.from || from),
      to: getAddress(outboundTo || to),

      blockNumber: Number(blockNumber),
      blockHash,
      txHash: transactionHash,
      logIndex,
      nonceMetadata,
      opHash,

      memo,
    };

    const opEvent = (() => {
      if (!noteInfo) {
        if (swapClogInbound) {
          return {
            type: "inboundSwap",
            ...partialClog,
            ...swapClogInbound,
          } as SwapClog;
        } else if (swapClogOutbound) {
          return {
            type: "outboundSwap",
            ...partialClog,
            ...swapClogOutbound,
          } as SwapClog;
        } else {
          return {
            type: "transfer",
            ...partialClog,
            requestStatus,
          } as SimpleTransferClog;
        }
      }

      const [noteStatus, noteEventType] = noteInfo;
      if (noteEventType === "create") {
        return {
          type: "createLink",
          noteStatus,
          ...partialClog,
        } as PaymentLinkClog;
      } else if (noteEventType === "claim") {
        return {
          type: "claimLink",
          noteStatus,
          ...partialClog,
        } as PaymentLinkClog;
      } else {
        throw new Error(`Unexpected note event type: ${noteEventType}`);
      }
    })();

    return opEvent;
  }

  /* Attach fee amounts to transfer ops and filter out transfers involving
   * paymaster.
   * TODO: unit test this function
   */
  private attachFeeAmounts(
    transferOpsIncludingPaymaster: TransferClog[]
  ): TransferClog[] {
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
