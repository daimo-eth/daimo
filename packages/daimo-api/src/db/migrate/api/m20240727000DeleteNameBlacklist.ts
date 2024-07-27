import { Kysely, Migration } from "kysely";

export const Migration20240727000DeleteNameBlacklist: Migration = {
  up: async (db: Kysely<any>) => {
    console.log(`[DB] dropping table name_blacklist`);
    await db.schema.dropTable("name_blacklist").execute();
  },
};
