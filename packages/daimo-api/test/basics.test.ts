import { getAccountChain } from "@daimo/common";
import assert from "node:assert";
import test from "node:test";
import { Chain, getAddress } from "viem";

import { getSwapQuote } from "../src/api/getSwapRoute";
import { StubExternalApiCache } from "../src/db/externalApiCache";
import { chainConfig } from "../src/env";
import { getViemClientFromEnv } from "../src/network/viemClient";
import { Telemetry } from "../src/server/telemetry";
import { TokenRegistry } from "../src/server/tokenRegistry";

const chain: Chain = chainConfig.chainL2;
const addrAlice = getAddress("0x061b0a794945fe0Ff4b764bfB926317f3cFc8b94");
const addrBob = getAddress("0x061b0a794945fe0Ff4b764bfB926317f3cFc8b93");

test("API", async () => {
  const isTestnet = chain.testnet;
  const monitor = new Telemetry();
  const vc = getViemClientFromEnv(monitor, new StubExternalApiCache());
  const tokenRegistry = new TokenRegistry();

  // Ensure the token registry loads correctly.
  await test("token registry setup", async () => {
    if (isTestnet) {
      // No token registry on testnet
      assert.strictEqual(tokenRegistry.getTokenList(chain.id).size, 0);
    } else {
      // If mainnet, we expect to have tokens
      assert.ok(
        tokenRegistry.getTokenList(chain.id).size > 0,
        "token registry is empty on mainnet"
      );
    }
  });

  // Ensure swap query on testnet fails.
  await test("check swap route query", async () => {
    const accountChain = getAccountChain(chain.id);
    if (!accountChain.nativeWETH) return;

    // Check that a swap route is successful on mainnet from WETH to USDC.
    const route = await getSwapQuote({
      amountInStr: "1000000000000000000", // 1 ETH
      tokenIn: accountChain.nativeWETH.address,
      tokenOut: accountChain.bridgeCoin.address,
      fromAccount: {
        addr: addrAlice,
      },
      toAddr: addrBob,
      chainId: chain.id,
      vc,
      tokenReg: tokenRegistry,
    });

    if (isTestnet) {
      assert.strictEqual(route, null); // No swap route on testnet
    } else {
      assert.ok(route, "swap route is null on mainnet");
      assert.ok(
        route.toAmount > 1000, // Assumes the price of 1 ETH > 1000 USDC
        "swap route does not give a reasonable route"
      );
    }
  });
});
