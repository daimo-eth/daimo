import {
  DaimoRequestState,
  DaimoRequestV2Status,
  amountToDollars,
  getEAccountStr,
  encodeRequestId,
} from "@daimo/common";
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
            log_addr
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
    };
    this.requests.set(log.id, requestStatus);

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
    const cancelledIDs = result.rows.map((log: any) => BigInt(log.id));
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
