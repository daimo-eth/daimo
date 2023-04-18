import { Account } from "./account";

// Interface for all Daimo onchain actions.
export interface Chain {
  getStatus(): Promise<ChainStatus>;

  createAccount(): Promise<Account>;

  // TODO: send transaction, add or remove device.
}

export interface ChainStatus {
  status: "ok" | "error";
  blockHeight: number;
  blockTimestamp: number;
  l1BlockHeight: number;
  l1BlockTimestamp: number;
}

export class StubChain implements Chain {
  async getStatus(): Promise<ChainStatus> {
    return {
      status: "ok",
      blockHeight: 0,
      blockTimestamp: 0,
      l1BlockHeight: 0,
      l1BlockTimestamp: 0,
    };
  }

  async createAccount(): Promise<Account> {
    return {
      storageVersion: 1,
      address: "0x123",
      lastBalance: 0,
      lastNonce: 0,
      lastBlockTimestamp: 0,
    };
  }
}
