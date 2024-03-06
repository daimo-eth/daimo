import { ProfileCache } from "@daimo/api/src/api/profile";
import { KeyRegistry } from "@daimo/api/src/contract/keyRegistry";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { DB, InviteGraphRow } from "@daimo/api/src/db/db";
import { getViemClientFromEnv } from "@daimo/api/src/network/viemClient";
import { InviteCodeTracker } from "@daimo/api/src/offchain/inviteCodeTracker";
import { InviteGraph } from "@daimo/api/src/offchain/inviteGraph";
import { Watcher } from "@daimo/api/src/shovel/watcher";
import {
  DaimoLink,
  DaimoLinkInviteCode,
  formatDaimoLink,
  parseDaimoLink,
} from "@daimo/common";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { getAddress } from "viem";

export function backfillInvitesDesc() {
  return "Parse Slack messages to backfill invite graph based on latest inviter in invitecode table";
}

/* 
Example slack message JSON:
    {
        "subtype": "bot_message",
        "text": "[Base]:tada: New user angelos with invite code <https:\/\/daimo.com\/l\/invite\/realworldeth> at <https:\/\/basescan.org\/address\/0x4131B32149D33F2588E572543e1ce6155Cb991EE>",
        "type": "message",
        "ts": "1709135816.941609",
        "bot_id": "B060P9Q4F7H",
        "blocks": [
            {
                "type": "rich_text",
                "block_id": "jMnU",
                "elements": [
                    {
                        "type": "rich_text_section",
                        "elements": [
                            {
                                "type": "text",
                                "text": "[Base]"
                            },
                            {
                                "type": "emoji",
                                "name": "tada",
                                "unicode": "1f389"
                            },
                            {
                                "type": "text",
                                "text": " New user angelos with invite code "
                            },
                            {
                                "type": "link",
                                "url": "https:\/\/daimo.com\/l\/invite\/realworldeth"
                            },
                            {
                                "type": "text",
                                "text": " at "
                            },
                            {
                                "type": "link",
                                "url": "https:\/\/basescan.org\/address\/0x4131B32149D33F2588E572543e1ce6155Cb991EE"
                            }
                        ]
                    }
                ]
            }
        ]
    }
*/

type SlackMessage = {
  subtype: string;
  text: string;
  type: string;
  ts: string;
  bot_id: string;
  blocks: any[];
};

const rows: { username: string; inviteCode: string }[] = [];

async function parseSlackMessagesJSON(data: any[]) {
  for (const message of data) {
    const slackMessage = message as SlackMessage;
    if (slackMessage.subtype !== "bot_message") continue;

    const text = slackMessage.text;
    // Check text contains "New user" and "invite code"
    if (!text.includes("New user")) continue;
    if (!text.includes("invite code")) continue;

    const match = text.match(/New user (.*) with invite code (.*?) /);
    if (!match) continue;

    const [, name, inviteCode] = match;

    console.log(`[NALIN] user: ${name}, code: ${inviteCode}`);
    rows.push({ username: name, inviteCode });
  }
}

async function writer() {
  const db = new DB();
  const vc = getViemClientFromEnv();
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

  const edges: InviteGraphRow[] = [];

  for (const row of rows) {
    const invitee = await nameReg.getEAccountFromStr(row.username);
    if (!invitee) {
      console.log(`[NALIN] Invalid username: ${row.username}`);
      continue;
    }
    const inviteLink: DaimoLink | null = (() => {
      if (row.inviteCode.includes("daimo.com"))
        return parseDaimoLink(row.inviteCode.slice(1, -1));
      else return { type: "invite", code: row.inviteCode };
    })();
    if (inviteLink == null || inviteLink.type !== "invite") {
      console.log(
        `[NALIN] Invalid invite code link: ${row.inviteCode} ${inviteLink}`
      );
      continue;
    }
    const invite = await inviteCodeTracker.getInviteCodeStatus(
      inviteLink as DaimoLinkInviteCode
    );

    if (invite.inviter) {
      const edge = {
        inviter: getAddress(invite.inviter.addr),
        invitee: getAddress(invitee.addr),
      };
      console.log(`[NALIN] edge: ${edge}`);
      edges.push(edge);
    }
  }

  // write edges to file
  writeFileSync("./invites/edges.json", JSON.stringify(edges, null, 2));
}

async function writeToDB() {
  const db = new DB();
  const inviteGraph = new InviteGraph(db);

  // Load invite edges
  const edges: InviteGraphRow[] = JSON.parse(
    readFileSync("./invites/edges.json", "utf8")
  );
  console.log(`[NALIN] loading ${edges.length} edges`);

  for (const edge of edges) {
    console.log(`[NALIN] adding edge ${JSON.stringify(edge)}`);
    await inviteGraph.addEdge(edge);
  }

  console.log(`[NALIN] done invite graph`);
}

export async function backfillInvites() {
  // go over all files in the directory
  // console.log(`[NALIN] Scanning invites directory`);
  // const files = readdirSync("./invites");
  // console.log(`[NALIN] Found ${files.length} files`);

  // for (const file of files) {
  //   // read file as JSON
  //   console.log(`[NALIN] Reading ${file}`);
  //   const data = JSON.parse(
  //     readFileSync(`./invites/${file}`, { encoding: "utf8", flag: "r" })
  //   );
  //   parseSlackMessagesJSON(data);
  //   // return;
  // }

  // // write rows to file
  // writeFileSync("./invites/rows.json", JSON.stringify(rows, null, 2));

  // writer();
  writeToDB();
}
