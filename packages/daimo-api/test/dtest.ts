import { CoinIndexer } from "../src/contract/coinIndexer";
import { KeyRegistry } from "../src/contract/keyRegistry";
import { NameRegistry } from "../src/contract/nameRegistry";
import { NoteIndexer } from "../src/contract/noteIndexer";
import { OpIndexer } from "../src/contract/opIndexer";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { Watcher } from "../src/shovel/watcher";

async function main() {
  const vc = getViemClientFromEnv();
  const opIndexer = new OpIndexer();
  const nameReg = new NameRegistry(vc, new Set<string>());
  const noteIndexer = new NoteIndexer(nameReg);
  const coinIndexer = new CoinIndexer(vc, opIndexer, noteIndexer);
  const keyReg = new KeyRegistry();

  const shovelWatcher = new Watcher();
  shovelWatcher.add(keyReg, nameReg, opIndexer, coinIndexer, noteIndexer);

  const { startBlock, lastBlockNum } = {
    startBlock: 5700000n,
    lastBlockNum: 7000000n,
  };
  await shovelWatcher.indexRange(startBlock, lastBlockNum);

  let numKeyData: number = 0;
  keyReg["addrToKeyData"].forEach((addr, kd) => (numKeyData += kd.length));

  console.log({
    allTransfers: coinIndexer["allTransfers"].length,
    txHashToSortedUserOps: opIndexer["txHashToSortedUserOps"].size,
    nonceMetadataToTxes: opIndexer["nonceMetadataToTxes"].size,
    accounts: nameReg["accounts"].length,
    notes: noteIndexer["notes"].size,
    keyToAddr: keyReg["keyToAddr"].size,
    addrToKeyData: keyReg["addrToKeyData"].size,
    numKeyData,
  });
}
main();
