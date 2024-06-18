import { now } from "@daimo/common";

import { DB } from "../db/db";
import { getNodeMetrics } from "../server/node";
import { Watcher } from "../shovel/watcher";

// Get node inspector session, for debugging.
const inspector = require("node:inspector/promises");
const session = new inspector.Session();
session.connect();

export async function healthDebug(
  db: DB,
  watcher: Watcher,
  startTimeS: number,
  trpcReqsInFlight: string[]
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
  } else if (indexer.shovelLatest < indexer.rpcLatest - 5) {
    status = "watcher-behind-rpc";
  } else if (node.mem.heapMB / node.mem.maxMB > 0.8) {
    status = "node-mem-full";
  } else if (apiDB.waitingCount > 10) {
    status = "api-db-overloaded";
  } else if (indexer.shovelDB.waitingCount > 10) {
    status = "shovel-db-overloaded";
  }

  const nPromises = await countPromises();

  return {
    status,
    nowS,
    uptimeS,
    node,
    apiDB,
    indexer,
    nPromises,
    trpcReqsInFlight: trpcReqsInFlight.slice(),
  };
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
