import { now } from "@daimo/common";

import { DB } from "../db/db";
import { IndexWatcher } from "../db/indexWatcher";
import { getNodeMetrics } from "../server/node";

// Get node inspector session, for debugging.
const inspector = require("node:inspector/promises");
const session = new inspector.Session();
session.connect();

export async function healthCheck(
  db: DB,
  watcher: IndexWatcher,
  startTimeS: number
) {
  return healthCheckInner(db, watcher, startTimeS, []);
}

export async function healthDebug(
  db: DB,
  watcher: IndexWatcher,
  startTimeS: number,
  trpcReqsInFlight: string[]
) {
  return healthCheckInner(db, watcher, startTimeS, trpcReqsInFlight, true);
}

async function healthCheckInner(
  db: DB,
  watcher: IndexWatcher,
  startTimeS: number,
  trpcReqsInFlight: string[],
  showDetailedDebug?: boolean
) {
  // Additional debug diagnostics
  const nowS = now();
  const uptimeS = nowS - startTimeS;
  const node = getNodeMetrics();
  const apiDB = db.getStatus();
  const indexer = watcher.getStatus();

  let status = "healthy";
  if (indexer.lastGoodTickS < nowS - 10) {
    status = "watcher-not-ticking";
  } else if (indexer.indexLatest < indexer.rpcLatest - 5) {
    status = "watcher-behind-rpc";
  } else if (node.mem.heapMB / node.mem.maxMB > 0.8) {
    status = "node-mem-full";
  } else if (apiDB.waitingCount > 10) {
    status = "api-db-overloaded";
  } else if (indexer.indexDB.waitingCount > 10) {
    status = "index-db-overloaded";
  }

  let ret = {
    status,
    nowS,
    uptimeS,
    node,
    apiDB,
    indexer,
  };

  if (showDetailedDebug) {
    const nPromises = await countPromises();
    const latencies = await watcher.getLatency();
    ret = {
      ...ret,
      nPromises,
      trpcReqsInFlight: trpcReqsInFlight.slice(),
      ...latencies,
    } as any;
  }

  return ret;
}

async function countPromises() {
  // resource management: put all results in an object group
  const objectGroup = crypto.randomUUID();

  // get reference to global Promise object prototype
  const {
    result: { objectId: promisePrototypeOID },
  } = await session.post("Runtime.evaluate", {
    objectGroup,
    expression: "Promise.prototype",
  });

  // get reference to array holding all promises
  const {
    objects: { objectId: promisesArrayOID },
  } = await session.post("Runtime.queryObjects", {
    objectGroup,
    prototypeObjectId: promisePrototypeOID,
  });

  // get contents of array; disable preview for performance reasons
  const { result } = await session.post("Runtime.getProperties", {
    objectId: promisesArrayOID,
    ownProperties: true,
    generatePreview: false,
  });

  // free resources, don't wait for completion
  session.post("Runtime.releaseObjectGroup", { objectGroup });

  // array includes "length" property, subtract one to correct
  return result.length - 1;
}
