import { assert } from "@daimo/common";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";

import { getI18N } from "../../i18n";
import { LanguageDefinition } from "../../i18n/languages/en";
import { getReqLang } from "../../i18n/server";

export class FarcasterCacheClient {
  private readonly client: NeynarAPIClient;
  readonly i18: LanguageDefinition["frame"];

  constructor(client: NeynarAPIClient) {
    this.client = client;

    const i18n = getI18N(getReqLang());
    this.i18 = i18n.frame;
  }

  async getUser(fid: number): Promise<User> {
    const resp = await this.client.fetchBulkUsers([fid]);
    assert(resp.users[0].fid === fid, this.i18.farcasterClient.wrongFid());
    return resp.users[0];
  }
}
