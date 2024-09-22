import {
  AddrLabel,
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  assertNotNull,
  bytesToAddr,
  debugJson,
  decodeRequestIdString,
  encodeRequestId,
  getEAccountStr,
  guessTimestampFromNum,
  now,
  parseRequestMetadata,
  retryBackoff,
} from "@daimo/common";
import { Kysely } from "kysely";
import { Address, Hex, bytesToHex } from "viem";

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
  blockTime: number;
}

interface RequestFulfilledLog {
  transactionHash: Hex;
  logIndex: number;
  id: bigint;
  fulfiller: Address;
  blockNumber: bigint;
  blockTime: number;
}

interface RequestCancelledLog {
  id: bigint;
  blockNumber: bigint;
  blockTime: number;
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

  async load(kdb: Kysely<IndexDB>, from: number, to: number) {
    const startTime = performance.now();

    // Load logs
    const rows = await retryBackoff(`requestIndexer-${from}-${to}`, () =>
      kdb
        .selectFrom("index.daimo_request")
        .selectAll()
        .where("chain_id", "=", "" + chainConfig.chainL2.id)
        .where((eb) => eb.between("block_num", "" + from, "" + to))
        .orderBy("block_num")
        .orderBy("log_idx")
        .execute()
    );

    // Load context + update in-memory request index
    const reqsCreated: RequestCreatedLog[] = rows
      .filter((r) => r.log_name === "RequestCreated")
      .map((r) => ({
        transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
        logIndex: Number(r.log_idx),
        id: BigInt(r.id),
        recipient: bytesToAddr(assertNotNull(r.recipient)),
        creator: bytesToAddr(assertNotNull(r.creator)),
        amount: BigInt(assertNotNull(r.amount)),
        metadata: bytesToHex(r.metadata || Buffer.from([])),
        logAddr: bytesToAddr(r.log_addr),
        blockNumber: BigInt(r.block_num),
        blockTime: Number(r.block_ts),
      }));
    const reqsFulfilled: RequestFulfilledLog[] = rows
      .filter((r) => r.log_name === "RequestFulfilled")
      .map((r) => ({
        transactionHash: bytesToHex(r.tx_hash, { size: 32 }),
        logIndex: Number(r.log_idx),
        id: BigInt(r.id),
        fulfiller: bytesToAddr(assertNotNull(r.fulfiller)),
        blockNumber: BigInt(r.block_num),
        blockTime: Number(r.block_ts),
      }));
    const reqsCancelled: RequestCancelledLog[] = rows
      .filter((r) => r.log_name === "RequestCancelled")
      .map((r) => ({
        id: BigInt(r.id),
        blockNumber: BigInt(r.block_num),
        blockTime: Number(r.block_ts),
      }));

    const statuses: DaimoRequestV2Status[] = [];
    statuses.push(...(await this.handleRequestsCreated(reqsCreated)));
    statuses.push(...(await this.handleRequestsFulfilled(reqsFulfilled)));
    statuses.push(...(await this.handleRequestsCancelled(reqsCancelled)));
    if (statuses.length === 0) return;

    // Log
    const elapsedMs = (performance.now() - startTime) | 0;
    console.log(
      `[REQUEST] handled ${rows.length} request updates in ${elapsedMs}ms`
    );

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
  private async handleRequestsCreated(
    logs: RequestCreatedLog[]
  ): Promise<DaimoRequestV2Status[]> {
    const promises = logs.map((log) => this.handleRequestCreated(log));
    return Promise.all(promises);
  }

  private async handleRequestCreated(
    log: RequestCreatedLog
  ): Promise<DaimoRequestV2Status> {
    console.log(`[REQUEST] RequestCreated ${log.id}`);
    if (this.requests.get(log.id) != null) {
      throw new Error(`bad RequestCreated: ${log.id} exists`);
    }

    // TODO: Anyone is allowed to create a request for any recipient on-chain.
    // In future, this could lead to potential spam attacks, so we can use
    // the creator field to filter whitelisted creators.
    const creator = await this.nameReg.getEAccount(log.creator);
    const recipient = await this.nameReg.getEAccount(log.recipient);

    if (creator.label !== AddrLabel.Faucet) {
      console.warn(`[REQUEST] ${log.id} creator ${debugJson(creator)} not API`);
    }

    const { fulfiller } = parseRequestMetadata(log.metadata);
    const expectedFulfiller = fulfiller
      ? await this.nameReg.getEAccount(fulfiller)
      : undefined;

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
      createdAt: log.blockTime,
      updatedAt: log.blockTime,
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

  private async handleRequestsFulfilled(
    reqs: RequestFulfilledLog[]
  ): Promise<DaimoRequestV2Status[]> {
    const promises = reqs
      .map(async (req) => {
        const request = this.requests.get(req.id);
        if (request == null) {
          console.error(`[REQUEST] RequestFulfilled missing ID: ${req.id}`);
          return null;
        }
        const fulfilledBy = await this.nameReg.getEAccount(req.fulfiller);
        request.fulfilledBy = fulfilledBy;
        request.status = DaimoRequestState.Fulfilled;
        request.updatedAt = req.blockTime;
        this.requests.set(req.id, request);
        this.logCoordinateToRequestFulfill.set(
          logCoordinateKey(req.transactionHash, req.logIndex),
          req.id
        );
        return request;
      })
      .filter((p) => p != null);
    const results = await Promise.all(promises);
    return results.filter((n) => n != null) as DaimoRequestV2Status[];
  }

  private async handleRequestsCancelled(
    reqs: RequestCancelledLog[]
  ): Promise<DaimoRequestV2Status[]> {
    const statuses = reqs
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

  private storeReqByAddress(address: Address, id: bigint) {
    const existingReqs = this.requestsByAddress.get(address) || [];
    this.requestsByAddress.set(address, [...existingReqs, id]);
  }

  // Fetch requests sent from/to an address: addr = creator or expectedFulfiller
  getAddrRequests(addr: Address): DaimoRequestV2Status[] {
    const requests = (this.requestsByAddress.get(addr) || [])
      .map((id) => this.requests.get(id))
      .filter((r) => r != null);
    return requests as DaimoRequestV2Status[];
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
