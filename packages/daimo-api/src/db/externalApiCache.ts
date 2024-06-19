import { Kysely } from "kysely";

import { DB as ApiDB } from "../codegen/dbApi";

export interface IExternalApiCache {
  get(
    apiType: string,
    key: string,
    execFn: () => Promise<string>,
    expiryS?: number
  ): Promise<string | undefined>;
}

export class StubExternalApiCache implements IExternalApiCache {
  async get(
    apiType: string,
    key: string,
    execFn: () => Promise<string>,
    expiryS?: number
  ): Promise<string | undefined> {
    return await execFn();
  }
}

// DB cache of external API calls.
// Improves reliability and helps us avoid rate limiting.
export class ExternalApiCache {
  constructor(private kdb: Kysely<ApiDB>) {
    console.log(`[EXT-API-CACHE] init`);
  }

  // Gets the cached version, if available. If unavailable or expired, uses
  // execFn to fetch and store. On error, prints error and returns cached value.
  async get(
    apiType: string,
    key: string,
    execFn: () => Promise<string>,
    expiryS?: number
  ) {
    const row = await this.kdb
      .selectFrom("external_api_cache")
      .select(["id", "api_type", "key", "value", "expires_at"])
      .where("api_type", "=", apiType)
      .where("key", "=", key)
      .where("expires_at", ">", new Date())
      .limit(1)
      .executeTakeFirst();

    let ret = row?.value;

    const updatedAt = new Date();
    const expiresAt = new Date(updatedAt.getTime() + 1000 * (expiryS || 60));

    if (row && row.expires_at > new Date()) {
      console.log(`[EXT-API-CACHE] hit ${apiType} ${key}`);
    } else {
      console.log(`[EXT-API-CACHE] miss ${apiType} ${key}`);
      try {
        ret = await execFn();
        await this.kdb
          .insertInto("external_api_cache")
          .values({
            api_type: apiType,
            key,
            value: ret,
            created_at: updatedAt,
            updated_at: updatedAt,
            expires_at: expiresAt,
          })
          .onConflict((b) =>
            b.columns(["api_type", "key"]).doUpdateSet({
              value: ret,
              updated_at: updatedAt,
              expires_at: expiresAt,
            })
          )
          .execute();
      } catch (e) {
        console.error(`[EXT-API-CACHE] error ${apiType} ${key}`, e);
      }
    }

    return ret;
  }
}
