import {
  OpStatus,
  PaymentLinkClog,
  PostSwapTransfer,
  PreSwapTransfer,
  TransferClog,
  assertNotNull,
  bytesToAddr,
  guessTimestampFromNum,
  hexToBuffer,
  retryBackoff,
} from "@daimo/common";
import { DaimoNonce } from "@daimo/userop";
import { Kysely } from "kysely";
import { Address, Hex, bytesToHex, getAddress, numberToHex } from "viem";

import { ClogMatcher } from "./ClogMatcher";
import { ForeignCoinIndexer } from "./foreignCoinIndexer";
import { Indexer } from "./indexer";
import { NoteIndexer } from "./noteIndexer";
import { OpIndexer } from "./opIndexer";
import { RequestIndexer } from "./requestIndexer";
import { DB as IndexDB } from "../codegen/dbIndex";
import { chainConfig } from "../env";
import { ViemClient } from "../network/viemClient";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";

/** ERC-20 or native token transfer. See daimo_transfers table. */
export interface Transfer {
  address: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  transactionHash: Hex;
  transactionIndex: number;
  /** Backcompat: not actually log index, but rather a sort index. */
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
    private clogMatcher: ClogMatcher
  ) {
    super("COIN");
  }

  public status() {
    return { numTransfers: this.allTransfers.length };
  }

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startTime = Date.now();

    const result = await retryBackoff(
      `homeCoinIndexer-logs-query-${from}-${to}`,
      () =>
        kdb
          .selectFrom("index.daimo_transfer")
          .select([
            "block_num",
            "block_hash",
            "tx_hash",
            "tx_idx",
            "sort_idx",
            "token",
            "f",
            "t",
            "amount",
          ])
          .where("chain_id", "=", "" + chainConfig.chainL2.id)
          .where((e) => e.between("block_num", "" + from, "" + to))
          .where("token", "=", hexToBuffer(chainConfig.tokenAddress))
          .orderBy("block_num")
          .orderBy("sort_idx")
          .execute()
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    const txHashes = new Set<Hex>();
    const logs: Transfer[] = result.map((row) => {
      const transferLog = {
        blockHash: bytesToHex(row.block_hash, { size: 32 }),
        blockNumber: BigInt(row.block_num),
        transactionHash: bytesToHex(row.tx_hash, { size: 32 }),
        transactionIndex: Number(row.tx_idx),
        logIndex: Number(row.sort_idx) / 2,
        address: bytesToAddr(assertNotNull(row.token)),
        from: bytesToAddr(row.f),
        to: bytesToAddr(row.t),
        value: BigInt(row.amount),
      };
      txHashes.add(transferLog.transactionHash);
      return transferLog;
    });
    if (logs.length === 0) return;

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[COIN] loaded ${logs.length} transfers ${from} ${to} in ${elapsedMs}ms`
    );

    this.allTransfers = this.allTransfers.concat(logs);
    logs.forEach((t) => {
      this.updateCurrentBalance(t.from, -t.value);
      this.updateCurrentBalance(t.to, t.value);
    });

    this.listeners.forEach((l) => l(logs));

    this.clogMatcher.loadCrossChainClogs(
      kdb,
      from,
      to,
      chainConfig.chainL2.id,
      txHashes
    );
  }

  updateCurrentBalance(addr: Address, delta: bigint) {
    const currentBalance = this.currentBalances.get(addr) || 0n;
    this.currentBalances.set(addr, currentBalance + delta);
  }

  /** Get current home coin balance. */
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
    let filtered = this.allTransfers.filter(
      (log) => (log.from === addr || log.to === addr) && log.value > 0n
    );

    if (sinceBlockNum) {
      filtered = filtered.filter(
        (log) => (log.blockNumber || 0n) >= sinceBlockNum
      );
    }
    if (txHashes !== undefined) {
      filtered = filtered.filter((log) =>
        txHashes.includes(log.transactionHash || "0x")
      );
    }

    // Add swap /  info
    const clogs = filtered.map((l) => this.createTransferClog(l, addr));

    // Filter out ERC20 paymaster transfers, attach as fees to other transfers
    const clogsWithFees = this.attachFeeAmounts(clogs);

    return clogsWithFees;
  }

  /* Populates atomic properties of logs to convert it to an Op Event.
   * Does not account for fees since they involve multiple transfer logs.
   *
   * Coalesced logs can be attributed to a simple transfer (same coin, same
   * chain), swap (different coins, same chain), or payment link.
   */
  createTransferClog(log: Transfer, accountAddr: Address): TransferClog {
    // Gather information about this transfer, potentially across multiple logs.
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

    // Sent or claimed a payment link?
    const noteInfo = this.noteIndexer.getNoteStatusbyLogCoordinate(
      transactionHash,
      logIndex - 1
    );

    // Fulfilled a request?
    const requestStatus =
      this.requestIndexer.getRequestStatusByFulfillLogCoordinate(
        transactionHash,
        logIndex - 1
      );

    const memo = opHash ? this.paymentMemoTracker.getMemo(opHash) : undefined;

    // If inbound swap or cross-chain transfers, attach original sender +
    // token + amount info.
    const notSwapAddrs = [chainConfig.pimlicoPaymasterAddress];
    const notSwap = notSwapAddrs.includes(from) || notSwapAddrs.includes(to);
    const correspondingForeignReceive =
      to === accountAddr &&
      !notSwap &&
      (this.foreignCoinIndexer.getForeignTokenReceiveForSwap(
        to,
        transactionHash
      ) ||
        this.clogMatcher.getCorrespondingTransfer(
          from,
          to,
          transactionHash,
          true
        ));

    const preSwapTransfer: PreSwapTransfer | undefined =
      correspondingForeignReceive
        ? {
            coin: correspondingForeignReceive.foreignToken,
            from: correspondingForeignReceive.from,
            amount: `${correspondingForeignReceive.value}` as `${bigint}`,
          }
        : undefined;

    // If outbound swap or cross-chain transfer, attach final destination info.
    const correspondingForeignSend =
      from === accountAddr &&
      !notSwap &&
      this.clogMatcher.getCorrespondingTransfer(from, to, transactionHash);
    const postSwapTransfer: PostSwapTransfer | undefined =
      correspondingForeignSend
        ? {
            to: correspondingForeignSend.to,
            coin: correspondingForeignSend.foreignToken,
            amount: `${correspondingForeignSend.value}` as `${bigint}`,
          }
        : undefined;

    // Base clog info (same for all TransferClog types)
    const partialClog = {
      status: OpStatus.confirmed,
      timestamp: guessTimestampFromNum(
        Number(blockNumber),
        chainConfig.daimoChain
      ),
      from: preSwapTransfer?.from || getAddress(from),
      to: postSwapTransfer?.to || getAddress(to),
      amount: Number(value),
      blockNumber: Number(blockNumber),
      blockHash,
      txHash: transactionHash,
      logIndex,
      nonceMetadata,
      opHash,

      memo,
    };

    const opEvent = (() => {
      if (noteInfo == null) {
        return {
          type: "transfer",
          ...partialClog,
          requestStatus,
          preSwapTransfer,
          postSwapTransfer,
        } as TransferClog;
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

  /**
   * Attach fee amounts to transfer ops and filter out transfers involving
   * paymaster.
   * TODO: unit test this function
   */
  private attachFeeAmounts(
    transferOpsIncludingPaymaster: TransferClog[]
  ): TransferClog[] {
    // Map of opHash to fee amount paid to paymaster address
    const paymasterAddr = chainConfig.pimlicoPaymasterAddress;
    const opHashToFee = new Map<Hex, number>();
    for (const op of transferOpsIncludingPaymaster) {
      if (op.opHash === undefined) continue;

      const prevFee = opHashToFee.get(op.opHash) || 0;

      if (op.to === paymasterAddr) {
        opHashToFee.set(op.opHash, prevFee + op.amount);
      } else if (op.from === paymasterAddr) {
        // Account for fee refund
        opHashToFee.set(op.opHash, prevFee - op.amount);
      }
    }

    const transferOps = transferOpsIncludingPaymaster
      .filter(
        // Remove paymaster logs
        (op) => op.from !== paymasterAddr && op.to !== paymasterAddr
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
