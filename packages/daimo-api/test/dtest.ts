import { ForeignCoinIndexer } from "../src/contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "../src/contract/homeCoinIndexer";
import { KeyRegistry } from "../src/contract/keyRegistry";
import { NameRegistry } from "../src/contract/nameRegistry";
import { NoteIndexer } from "../src/contract/noteIndexer";
import { OpIndexer } from "../src/contract/opIndexer";
import { RequestIndexer } from "../src/contract/requestIndexer";
import { UniswapClient } from "../src/network/uniswapClient";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { PaymentMemoTracker } from "../src/offchain/paymentMemoTracker";
import { Telemetry } from "../src/server/telemetry";
import { Watcher } from "../src/shovel/watcher";

async function main() {
  const monitor = new Telemetry();
  const vc = getViemClientFromEnv(monitor);
  const uc = new UniswapClient();
  const opIndexer = new OpIndexer();
  const nameReg = new NameRegistry(
    vc,
    null as any,
    null as any,
    new Set<string>()
  );
  const noteIndexer = new NoteIndexer(nameReg);
  const requestIndexer = new RequestIndexer(null as any, nameReg);
  const paymentMemoTracker = new PaymentMemoTracker(null as any);
  const foreignCoinIndexer = new ForeignCoinIndexer(nameReg, vc, uc);
  const coinIndexer = new HomeCoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer,
    foreignCoinIndexer,
    paymentMemoTracker
  );
  const keyReg = new KeyRegistry();

  const shovelWatcher = new Watcher();
  shovelWatcher.add(
    [nameReg, keyReg, opIndexer],
    [noteIndexer, requestIndexer],
    [coinIndexer]
  );

  const lastBlockNum = 7000000;
  await shovelWatcher.catchUpTo(lastBlockNum);

  let numKeyData: number = 0;
  keyReg["addrToKeyData"].forEach((addr, kd) => (numKeyData += kd.length));

  console.log({
    allTransfers: coinIndexer["allTransfers"].length,
    txHashToSortedUserOps: opIndexer["txHashToSortedUserOps"].size,
    accounts: nameReg["accounts"].length,
    notes: noteIndexer["notes"].size,
    keyToAddr: keyReg["keyToAddr"].size,
    addrToKeyData: keyReg["addrToKeyData"].size,
    numKeyData,
  });
}
main();
