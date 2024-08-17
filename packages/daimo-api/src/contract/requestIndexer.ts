import {
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  getEAccountStr,
  encodeRequestId,
  parseRequestMetadata,
  guessTimestampFromNum,
  now,
  AddrLabel,
  decodeRequestIdString,
  retryBackoff,
} from "@daimo/common";
import { Kysely } from "kysely";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { Indexer } from "./indexer";
import { NameRegistry } from "./nameRegistry";
import { DB as IndexDB } from "../codegen/dbIndex";
import { DB } from "../db/db";
import { chainConfig } from "../env";
import { PaymentMemoTracker } from "../offchain/paymentMemoTracker";
import { logCoordinateKey } from "../utils/indexing";

interface RequestCreatedLog {
  transactionHash: Hex;
  logIndex: number;
  id: bigint;
  recipient: Address;
  creator: Address;
  amount: bigint;
  metadata: Hex;
  logAddr: Address;
  blockNumber: bigint;
}

interface RequestFulfilledLog {
  transactionHash: Hex;
  logIndex: number;
  id: bigint;
  fulfiller: Address;
  blockNumber: bigint;
}

interface RequestCancelledLog {
  id: bigint;
  blockNumber: bigint;
}

/* Request contract. Tracks request creation and fulfillment. */
export class RequestIndexer extends Indexer {
  // Index requests by request ID
  private requests: Map<bigint, DaimoRequestV2Status> = new Map();
  // Index requests by creator or expectedFulfiller
  private requestsByAddress: Map<Address, bigint[]> = new Map();
  // Index requests by the log coordinates of the RequestFulfilled event
  private logCoordinateToRequestFulfill: Map<string, bigint> = new Map();
  private listeners: ((logs: DaimoRequestV2Status[]) => void)[] = [];

  constructor(
    private db: DB,
    private nameReg: NameRegistry,
    private paymentMemoTracker: PaymentMemoTracker
  ) {
    super("REQUEST");
  }

  async load(pg: Pool, kdb: Kysely<IndexDB>, from: number, to: number) {
    const startTime = Date.now();
    const statuses: DaimoRequestV2Status[] = [];
    statuses.push(...(await this.loadCreated(pg, from, to)));
    statuses.push(...(await this.loadCancelled(pg, from, to)));
    statuses.push(...(await this.loadFulfilled(pg, from, to)));
    if (statuses.length === 0) return;

    const elapsedMs = (Date.now() - startTime) | 0;
    console.log(
      `[REQUEST] loaded ${statuses.length} statuses in ${elapsedMs}ms`
    );

    if (this.updateLastProcessedCheckStale(from, to)) return;

    // Finally, invoke listeners to send notifications etc.
    const ls = this.listeners;
    ls.forEach((l) => l(statuses));
  }

  // Note that init is run after loads.
  async init() {
    const declinedRequests = await this.db.loadDeclinedRequests();
    for (const r of declinedRequests) {
      const request = this.requests.get(r.requestId);
      if (request == null) {
        console.error(`[REQUEST] init: declined req not found: ${r.requestId}`);
        continue;
      }
      request.status = DaimoRequestState.Declined;
      request.updatedAt = Math.max(request.updatedAt || 0, r.createdAt);
      this.requests.set(r.requestId, request);
    }
  }

  addListener(listener: (statuses: DaimoRequestV2Status[]) => void) {
    this.listeners.push(listener);
  }

  private async loadCreated(
    pg: Pool,
    from: number,
    to: number
  ): Promise<DaimoRequestV2Status[]> {
    const result = await retryBackoff(`requestLoadCreated-${from}-${to}`, () =>
      pg.query(
        `select
            tx_hash,
            log_idx,
            id,
            recipient,
            creator,
            amount,
            metadata,
            log_addr,
            block_num
          from request_created
          where block_num >= $1
          and block_num <= $2
          and chain_id = $3
      `,
        [from, to, chainConfig.chainL2.id]
      )
    );
    const logs = result.rows.map(rowToRequestCreatedLog);
    // todo: ignore requests not made by the API

    const promises = logs.map(async (l) => {
      try {
        return this.handleRequestCreated(l);
      } catch (e) {
        console.error(`[REQUEST] error handling RequestCreated: ${e}`);
        return null;
      }
    });
    const statuses = (await Promise.all(promises)).filter((n) => n != null);
    return statuses as DaimoRequestV2Status[];
  }

  private async handleRequestCreated(
    log: RequestCreatedLog
  ): Promise<DaimoRequestV2Status> {
    console.log(`[REQUEST] RequestCreated ${log.id}`);
    if (this.requests.get(log.id) != null) {
      throw new Error(`bad RequestCreated: ${log.id} exists`);
    }

    const recipient = await this.nameReg.getEAccount(log.recipient);

    // TODO: Anyone is allowed to create a request for any recipient on-chain.
    // In future, this could lead to potential spam attacks, so we can use
    // the creator field to filter whitelisted creators.
    const creator = await this.nameReg.getEAccount(log.creator);

    if (creator.label !== AddrLabel.Faucet) {
      console.warn(
        `[REQUEST] ${log.id} creator ${JSON.stringify(creator)} is not API`
      );
    }

    const { fulfiller } = parseRequestMetadata(log.metadata);
    const expectedFulfiller = fulfiller
      ? await this.nameReg.getEAccount(fulfiller)
      : undefined;

    const createdAt = guessTimestampFromNum(
      log.blockNumber,
      chainConfig.daimoChain
    );

    // Get optional memo, offchain
    // TODO: index memos by {noteID, requestID, or transferLogCoord}, not hash
    const memo = this.paymentMemoTracker.getMemo(log.transactionHash);

    const requestStatus: DaimoRequestV2Status = {
      link: {
        type: "requestv2",
        id: encodeRequestId(log.id),
        recipient: getEAccountStr(recipient),
        dollars: amountToDollars(log.amount),
      },
      recipient,
      creator,
      status: DaimoRequestState.Created,
      metadata: log.metadata,
      createdAt,
      updatedAt: createdAt,
      expectedFulfiller,
      memo,
    };
    console.log(`[REQUEST] request created ${JSON.stringify(requestStatus)}`);

    // Add to in-memory index
    this.requests.set(log.id, requestStatus);
    this.storeReqByAddress(recipient.addr, log.id);
    if (expectedFulfiller) {
      this.storeReqByAddress(expectedFulfiller.addr, log.id);
    }

    return requestStatus;
  }

  private async loadCancelled(
    pg: Pool,
    from: number,
    to: number
  ): Promise<DaimoRequestV2Status[]> {
    const result = await retryBackoff(
      `requestLoadCancelled-${from}-${to}`,
      () =>
        pg.query(
          `
          select
            id,
            block_num
        from request_cancelled
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
      `,
          [from, to, chainConfig.chainL2.id]
        )
    );
    const cancelledRequests = result.rows.map(rowToRequestCancelledLog);
    const statuses = cancelledRequests
      .map((req) => {
        const request = this.requests.get(req.id);
        if (request == null) {
          console.error(`[REQUEST] error handling RequestCancelled: ${req.id}`);
          return null;
        }
        request.status = DaimoRequestState.Cancelled;
        request.updatedAt = guessTimestampFromNum(
          req.blockNumber,
          chainConfig.daimoChain
        );
        this.requests.set(req.id, request);
        return request;
      })
      .filter((n) => n != null);

    return statuses as DaimoRequestV2Status[];
  }

  private async loadFulfilled(
    pg: Pool,
    from: number,
    to: number
  ): Promise<DaimoRequestV2Status[]> {
    const result = await retryBackoff(
      `requestLoadFulfilled-${from}-${to}`,
      () =>
        pg.query(
          `select
             tx_hash,
             log_idx,
             id,
             fulfiller,
             block_num
          from request_fulfilled
          where block_num >= $1
          and block_num <= $2
          and chain_id = $3`,
          [from, to, chainConfig.chainL2.id]
        )
    );
    const fulfilledRequests = result.rows.map(rowToRequestFulfilledLog);
    const promises = fulfilledRequests
      .map(async (req) => {
        const request = this.requests.get(req.id);
        if (request == null) {
          console.error(`[REQUEST] error handling RequestFulfilled: ${req.id}`);
          return null;
        }
        const fulfilledBy = await this.nameReg.getEAccount(req.fulfiller);
        request.fulfilledBy = fulfilledBy;
        request.status = DaimoRequestState.Fulfilled;
        request.updatedAt = guessTimestampFromNum(
          req.blockNumber,
          chainConfig.daimoChain
        );
        this.requests.set(req.id, request);
        this.logCoordinateToRequestFulfill.set(
          logCoordinateKey(req.transactionHash, req.logIndex),
          req.id
        );
        return request;
      })
      .filter((n) => n != null);
    const statuses = (await Promise.all(promises)).filter((n) => n != null);
    return statuses as DaimoRequestV2Status[];
  }

  private storeReqByAddress(address: Address, id: bigint) {
    const existingReqs = this.requestsByAddress.get(address) || [];
    this.requestsByAddress.set(address, [...existingReqs, id]);
  }

  // Fetch requests sent from/to an address: addr = creator or expectedFulfiller
  getAddrRequests(addr: Address) {
    const requests = (this.requestsByAddress.get(addr) || []).map(
      (id) => this.requests.get(id)!
    );

    return requests;
  }

  // TODO: gate creates and declines by account API key
  async declineRequest(idString: string, decliner: Address) {
    const id = decodeRequestIdString(idString);

    const request = this.requests.get(id)!;

    const { fulfiller } = parseRequestMetadata(request.metadata);

    if (!fulfiller) {
      console.log(`[REQUEST] no fulfiller for ${id}`);
      return;
    }

    const expectedFulfiller = await this.nameReg.getEAccount(fulfiller);

    if (expectedFulfiller.addr !== decliner) {
      console.log(`[REQUEST] invalid decliner for ${id}`);
      return;
    }

    if (
      request.status === DaimoRequestState.Created ||
      request.status === DaimoRequestState.Pending
    ) {
      await this.db.insertDeclinedRequest(id, decliner);
      this.requests.set(id, {
        ...request,
        status: DaimoRequestState.Declined,
        updatedAt: now(),
      });

      const ls = this.listeners;
      ls.forEach((l) => l([this.requests.get(id)!]));
    } else {
      console.log(`[REQUEST] skipping decline for ${id}: ${request.status}`);
    }
  }

  getRequestStatusById(id: bigint): DaimoRequestV2Status | null {
    return this.requests.get(id) || null;
  }

  getRequestStatusByFulfillLogCoordinate(
    transactionHash: Hex,
    logIndex: number
  ) {
    const id = this.logCoordinateToRequestFulfill.get(
      logCoordinateKey(transactionHash, logIndex)
    );
    if (id == null) return null;
    return this.getRequestStatusById(id);
  }
}

function rowToRequestCreatedLog(r: any): RequestCreatedLog {
  return {
    transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
    logIndex: r.log_idx,
    id: BigInt(r.id),
    recipient: getAddress(bytesToHex(r.recipient, { size: 20 })),
    creator: getAddress(bytesToHex(r.creator, { size: 20 })),
    amount: BigInt(r.amount),
    metadata: bytesToHex(r.metadata || []),
    logAddr: getAddress(bytesToHex(r.log_addr, { size: 20 })),
    blockNumber: BigInt(r.block_num),
  };
}

function rowToRequestFulfilledLog(r: any): RequestFulfilledLog {
  return {
    transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
    logIndex: r.log_idx,
    id: BigInt(r.id),
    fulfiller: getAddress(bytesToHex(r.fulfiller, { size: 20 })),
    blockNumber: BigInt(r.block_num),
  };
}

function rowToRequestCancelledLog(r: any): RequestCancelledLog {
  return {
    id: BigInt(r.id),
    blockNumber: BigInt(r.block_num),
  };
}
