import { ProfileCache } from "@daimo/api/src/api/profile";
import { getTagRedirectHist } from "@daimo/api/src/api/tagRedirect";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { RequestIndexer } from "@daimo/api/src/contract/requestIndexer";
import { DB } from "@daimo/api/src/db/db";
import { getViemClientFromEnv } from "@daimo/api/src/network/viemClient";
import { InviteGraph } from "@daimo/api/src/offchain/inviteGraph";
import { Watcher } from "@daimo/api/src/shovel/watcher";
import { DaimoRequestV2Status } from "@daimo/common";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

export function requestTrackingDesc() {
  return "Custom script to do aggregates on requests";
}

function convertUnixTimestampToDenverTime(unixTimestamp: number): string {
  // Convert Unix timestamp from seconds to milliseconds and create a Date object
  const date = new Date(unixTimestamp * 1000);

  // Use Intl.DateTimeFormat to format the date in 'America/Denver' timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });

  return formatter.format(date);
}

export async function requestTracking() {
  const vc = getViemClientFromEnv();

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
  const requestIndexer = new RequestIndexer(nameReg);

  const shovelWatcher = new Watcher();
  shovelWatcher.add(nameReg, requestIndexer);

  await shovelWatcher.init();
  await inviteGraph.init();
  await profileCache.init();

  console.log(
    `[NALIN] loading requests from DB ${requestIndexer.requests.size}`
  );

  const tagRedirectHist = await getTagRedirectHist("ecd", db);

  const requests: {
    fulfillerName: string;
    memo: string;
    requestId: string;
    tagTime: string;
    dollars: `${number}`;
  }[] = [];

  let total = 0,
    boneBroth = 0,
    other = 0;

  for (const request of requestIndexer.requests.values()) {
    if (request.recipient?.name !== "edgecity" || !request.fulfilledBy)
      continue;

    const requestId = request.link.id;
    console.log(`[NALIN] trying request ${requestId}`);

    for (const tag of tagRedirectHist) {
      if (tag.link.includes(requestId)) {
        const url = new URL(tag.link);
        const memo = url.searchParams.get("memo")!;
        console.log(
          `[NALIN] found request ${requestId} in tag ${tag.link} ${memo}`
        );

        const denverTagTime = convertUnixTimestampToDenverTime(tag.time);

        requests.push({
          dollars: request.link.dollars,
          fulfillerName: request.fulfilledBy?.name || "not fulfilled",
          memo,
          requestId,
          tagTime: denverTagTime,
        });

        if (memo.includes("Bone Broth"))
          // Looks like no bone broth orders collated with non bone broth orders, so our life is much simpler
          boneBroth += Number(request.link.dollars);
        else other += Number(request.link.dollars);

        total += Number(request.link.dollars);
      }
    }
  }

  console.log(`[NALIN] total ${total} bone broth ${boneBroth} other ${other}`);

  // write requests to file as json
  writeFileSync(`requests.json`, JSON.stringify(requests, null, 2));
}
