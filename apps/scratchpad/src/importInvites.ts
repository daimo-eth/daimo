import { ProfileCache } from "@daimo/api/src/api/profile";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { DB, InviteCodeRow } from "@daimo/api/src/db/db";
import { getViemClientFromEnv } from "@daimo/api/src/network/viemClient";
import { InviteCodeTracker } from "@daimo/api/src/offchain/inviteCodeTracker";
import { InviteGraph } from "@daimo/api/src/offchain/inviteGraph";
import { Watcher } from "@daimo/api/src/shovel/watcher";
import csv from "csvtojson";

export function importInvitesDesc() {
  return "Import invites from a CSV file";
}

async function preamble() {
  console.log(`[API] starting...`);
  const vc = getViemClientFromEnv();

  console.log(`[API] initializing db...`);
  const db = new DB();

  console.log(`[API] using wallet ${vc.walletClient.account.address}`);
  const inviteGraph = new InviteGraph(db);
  const profileCache = new ProfileCache(vc, db);

  const nameReg = new NameRegistry(
    vc,
    inviteGraph,
    profileCache,
    await db.loadNameBlacklist()
  );
  const inviteCodeTracker = new InviteCodeTracker(vc, nameReg, db);

  const shovelWatcher = new Watcher();
  shovelWatcher.add(nameReg);

  await shovelWatcher.init();
  await inviteGraph.init();
  await profileCache.init();

  return {
    vc,
    db,
    inviteGraph,
    profileCache,
    nameReg,
    inviteCodeTracker,
  };
}

export async function importInvites() {
  const { vc, db, inviteGraph, profileCache, nameReg, inviteCodeTracker } =
    await preamble();
  // read CSV file
  const csvPath = process.argv[3];
  if (!csvPath) throw new Error("Usage: import-invites <csv path>");

  const json = await csv().fromFile(csvPath);

  for (const row of json) {
    console.log(row);
    // if (row.notes !== "") continue;

    const inviter = nameReg.resolveName(row.username.toLowerCase());
    if (inviter == null) {
      console.log(`[INVITE] skipping ${row.username} (no inviter)`);
      continue;
    }

    const inviteCode = await inviteCodeTracker.getBestInviteCodeForSender(
      inviter
    );

    if (inviteCode) {
      console.log(
        `[INVITE] could skip ${row.username} (already given ${inviteCode})`
      );
      // continue;
    }

    const mini = Math.min(
      Number(row.bonus_cents_invitee) / 100,
      Number(row.bonus_cents_inviter) / 100
    );
    const bonusDollarsInvitee =
      mini === 0 ? Number(row.bonus_cents_invitee) / 100 : mini;
    const bonusDollarsInviter = mini;

    const inviteCodeRow: InviteCodeRow = {
      code: row.code.toLowerCase(),
      useCount: 0,
      maxUses: Number(row.max_uses),
      zupassEmail: null,
      inviter,
      bonusDollarsInvitee,
      bonusDollarsInviter,
    };
    console.log(`[INVITE] inserting ${JSON.stringify(inviteCodeRow)}`);
    await db.insertInviteCode(inviteCodeRow);
  }
}
