import { CoinIndexer } from "../src/contract/coinIndexer";
import { OpIndexer } from "../src/contract/opIndexer";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { Watcher } from "../src/shovel/watcher";

async function main() {
  const vc = getViemClientFromEnv();
  await vc.init();

  const opIndexer = new OpIndexer();
  const coinIndexer = new CoinIndexer(vc, opIndexer);
  const { startBlock, lastBlockNum } = {
    startBlock: 5700000n,
    lastBlockNum: 7000000n,
  };

  const shovelWatcher = new Watcher();
  shovelWatcher.add(opIndexer, coinIndexer);
  await shovelWatcher.init(startBlock, lastBlockNum);

  console.log({
    transfers: coinIndexer["allTransfers"].length,
    op1: opIndexer["txHashToSortedUserOps"].size,
    op2: opIndexer["nonceMetadataToTxes"].size,
  });
}
main();
