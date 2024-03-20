import {
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  getEAccountStr,
  encodeRequestId,
  parseRequestMetadata,
  guessTimestampFromNum,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { Pool } from "pg";
import { Address, Hex, bytesToHex, getAddress } from "viem";

import { NameRegistry } from "./nameRegistry";
import { chainConfig } from "../env";
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
}

/* Request contract. Tracks request creation and fulfillment. */
export class RequestIndexer {
  private requests: Map<bigint, DaimoRequestV2Status> = new Map();
  private requestsByAddress: Map<Address, Set<bigint>> = new Map();
  private logCoordinateToRequestFulfill: Map<string, bigint> = new Map();
  private listeners: ((logs: DaimoRequestV2Status[]) => void)[] = [];

  constructor(private nameReg: NameRegistry) {}

  async load(pg: Pool, from: bigint, to: bigint) {
    const startTime = Date.now();
    const statuses: DaimoRequestV2Status[] = [];
    statuses.push(...(await this.loadCreated(pg, from, to)));
    statuses.push(...(await this.loadCancelled(pg, from, to)));
    statuses.push(...(await this.loadFulfilled(pg, from, to)));
    console.log(
      `[REQUEST] Loaded ${statuses.length} statuses in ${
        Date.now() - startTime
      }ms`
    );
    // Finally, invoke listeners to send notifications etc.
    const ls = this.listeners;
    ls.forEach((l) => l(statuses));
  }

  addListener(listener: (statuses: DaimoRequestV2Status[]) => void) {
    this.listeners.push(listener);
  }

  private async loadCreated(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<DaimoRequestV2Status[]> {
    const result = await pg.query(
      `
          select
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
    );
    const logs = result.rows.map(rowToRequestCreatedLog);
    // todo: ignore requests not made by the API

    const promises = logs.map(async (l) => {
      try {
        return this.handleRequestCreated(l);
      } catch (e) {
        console.error(`[REQUEST] Error handling RequestCreated: ${e}`);
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
      createdAt: guessTimestampFromNum(
        log.blockNumber,
        daimoChainFromId(chainConfig.chainL2.id)
      ),
    };
    this.requests.set(log.id, requestStatus);

    // Parse metadata for fulfiller and add address to map.
    // For now, this is sufficient proof that the request was created on
    // Daimo.
    const { fulfiller } = parseRequestMetadata(log.metadata);

    if (fulfiller) {
      this.storeReqByAddress(fulfiller, log.id);
      this.storeReqByAddress(recipient.addr, log.id);
    }

    return requestStatus;
  }

  private async loadCancelled(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<DaimoRequestV2Status[]> {
    const result = await pg.query(
      `
          select
            id
        from request_cancelled
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
      `,
      [from, to, chainConfig.chainL2.id]
    );
    const cancelledIDs = result.rows.map((log) => BigInt(log.id));
    const statuses = cancelledIDs
      .map((id) => {
        const request = this.requests.get(id);
        if (request == null) {
          console.error(`[REQUEST] Error handling RequestCancelled: ${id}`);
          return null;
        }
        request.status = DaimoRequestState.Cancelled;
        this.requests.set(id, request);
        return request;
      })
      .filter((n) => n != null);

    return statuses as DaimoRequestV2Status[];
  }

  private async loadFulfilled(
    pg: Pool,
    from: bigint,
    to: bigint
  ): Promise<DaimoRequestV2Status[]> {
    const result = await pg.query(
      `
          select
            tx_hash,
            log_idx,
            id,
            fulfiller
        from request_fulfilled
        where block_num >= $1
        and block_num <= $2
        and chain_id = $3
      `,
      [from, to, chainConfig.chainL2.id]
    );
    const fulfilledRequests = result.rows.map(rowToRequestFulfilledLog);
    const promises = fulfilledRequests
      .map(async (req) => {
        const request = this.requests.get(req.id);
        if (request == null) {
          console.error(`[REQUEST] Error handling RequestFulfilled: ${req.id}`);
          return null;
        }
        const fulfilledBy = await this.nameReg.getEAccount(req.fulfiller);
        request.fulfilledBy = fulfilledBy;
        request.status = DaimoRequestState.Fulfilled;
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
    const existingSet = this.requestsByAddress.get(address);

    if (!existingSet) {
      this.requestsByAddress.set(address, new Set([id]));
    } else {
      existingSet.add(id);
    }
  }

  // Fetch requests made/received by a user
  async getUserRequests(addr: Address) {
    const reqs = [];
    const ids = this.requestsByAddress.get(addr);

    for (const requestId of Array.from(ids || [])) {
      const request = this.requests.get(requestId);

      if (request == null) continue;
      // If the request is cancelled or fulfilled, ignore.
      const done = [DaimoRequestState.Cancelled, DaimoRequestState.Fulfilled];
      if (done.includes(request.status)) continue;

      const { fulfiller } = parseRequestMetadata(request.metadata);
      if (!fulfiller) continue;

      // Consider putting this directly on the request object.
      // Handling here is to avoid confusion with `fulfilledBy`.
      const fulfillerAccount = await this.nameReg.getEAccount(fulfiller);

      reqs.push({
        type: fulfillerAccount.addr === addr ? "fulfiller" : "recipient",
        request,
        fulfiller: fulfillerAccount,
      } as const);
    }

    return reqs;
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
    metadata: bytesToHex(r.metadata),
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
  };
}
