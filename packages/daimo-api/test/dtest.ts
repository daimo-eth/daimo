import { ForeignCoinIndexer } from "../src/contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "../src/contract/homeCoinIndexer";
import { KeyRegistry } from "../src/contract/keyRegistry";
import { NameRegistry } from "../src/contract/nameRegistry";
import { NoteIndexer } from "../src/contract/noteIndexer";
import { OpIndexer } from "../src/contract/opIndexer";
import { RequestIndexer } from "../src/contract/requestIndexer";
import { StubExternalApiCache } from "../src/db/externalApiCache";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { PaymentMemoTracker } from "../src/offchain/paymentMemoTracker";
import { Telemetry } from "../src/server/telemetry";
import { TokenRegistry } from "../src/server/tokenRegistry";
import { Watcher } from "../src/shovel/watcher";

// Testing.
export async function main() {
  const monitor = new Telemetry();
  const vc = getViemClientFromEnv(monitor, new StubExternalApiCache());
  const nameReg = new NameRegistry(
    vc,
    null as any,
    null as any,
    new Set<string>()
  );
  const paymentMemoTracker = new PaymentMemoTracker(null as any);

  const opIndexer = new OpIndexer();
  const noteIndexer = new NoteIndexer(nameReg, opIndexer, paymentMemoTracker);
  const requestIndexer = new RequestIndexer(
    null as any,
    nameReg,
    paymentMemoTracker
  );
  const tokenReg = new TokenRegistry();
  const foreignCoinIndexer = new ForeignCoinIndexer(nameReg, vc, tokenReg);
  const coinIndexer = new HomeCoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer,
    foreignCoinIndexer,
    paymentMemoTracker
  );
  const keyReg = new KeyRegistry();

  const shovelWatcher = new Watcher(vc.publicClient);
  shovelWatcher.add(
    [nameReg, keyReg, opIndexer],
    [noteIndexer, requestIndexer],
    [coinIndexer]
  );

  const lastBlockNum = 7000000;
  await shovelWatcher.catchUpTo(lastBlockNum);

  let numKeyData: number = 0;
  keyReg["addrToKeyData"].forEach((_, kd) => (numKeyData += kd.length));

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
