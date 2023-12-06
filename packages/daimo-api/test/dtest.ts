import { CoinIndexer } from "../src/contract/coinIndexer";
import { NameRegistry } from "../src/contract/nameRegistry";
import { NoteIndexer } from "../src/contract/noteIndexer";
import { OpIndexer } from "../src/contract/opIndexer";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { Watcher } from "../src/shovel/watcher";

async function main() {
  const vc = getViemClientFromEnv();
  await vc.init();

  const opIndexer = new OpIndexer();
  const coinIndexer = new CoinIndexer(vc, opIndexer);
  const nameReg = new NameRegistry(vc, new Set<string>());
  const noteIndexer = new NoteIndexer(nameReg);

  const shovelWatcher = new Watcher();
  shovelWatcher.add(nameReg, opIndexer, coinIndexer, noteIndexer);

  const { startBlock, lastBlockNum } = {
    startBlock: 5700000n,
    lastBlockNum: 7000000n,
  };
  await shovelWatcher.init(startBlock, lastBlockNum);

  console.log({
    allTransfers: coinIndexer["allTransfers"].length,
    txHashToSortedUserOps: opIndexer["txHashToSortedUserOps"].size,
    nonceMetadataToTxes: opIndexer["nonceMetadataToTxes"].size,
    accounts: nameReg["accounts"].length,
    notes: noteIndexer["notes"].size,
  });
}
main();
