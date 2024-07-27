import { debugJson } from "@daimo/common";
import { Kysely, Migration, Migrator } from "kysely";

import { Migration20240727000DeleteNameBlacklist } from "./migrate/api/m20240727000DeleteNameBlacklist";
import { Migration20240726000CreateDaimoAccount } from "./migrate/shovel/m20240726000CreateDaimoAccount";

const migrationsAPI: Record<string, Migration> = {
  "20240727000": Migration20240727000DeleteNameBlacklist,
};

const migrationsShovel: Record<string, Migration> = {
  "20240726000": new Migration20240726000CreateDaimoAccount(),
};

export async function migrateDB(kdb: Kysely<any>, name: "api" | "shovel") {
  const migrations = name === "api" ? migrationsAPI : migrationsShovel;
  const provider = { getMigrations: () => Promise.resolve(migrations) };
  const migrator = new Migrator({ db: kdb, provider });

  console.log("WTF 0", migrations["20240727000"].up);

  const { error, results } = await migrator.migrateToLatest();
  console.log(`WTF # results: ${results?.length}`);

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`[DB] ✅ migration "${it.migrationName}" success`);
    } else if (it.status === "Error") {
      console.error(`[DB] ❌ migration "${it.migrationName}" failed`);
    } else {
      console.log(`WTF: ${it.migrationName} ${it.status}`);
    }
  });

  if (error) throw new Error(debugJson(error));
}
