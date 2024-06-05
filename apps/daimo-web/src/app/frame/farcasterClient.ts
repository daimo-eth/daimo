import { assert } from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";

export class FarcasterCacheClient {
  private readonly client: NeynarAPIClient;

  constructor(client: NeynarAPIClient) {
    this.client = client;
  }

  async getUser(fid: number): Promise<User> {
    const resp = await this.client.fetchBulkUsers([fid]);
    assert(resp.users[0].fid === fid, "Wrong fid");
    return resp.users[0];
  }
}
