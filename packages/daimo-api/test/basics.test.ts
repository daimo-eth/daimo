import assert from "node:assert";
import test from "node:test";
import { Chain } from "viem";

import { chainConfig } from "../src/env";
import { TokenRegistry } from "../src/server/tokenRegistry";

const chain: Chain = chainConfig.chainL2;

test("API basic functionality", async () => {
  const tokenRegistry = new TokenRegistry();

  // Ensure the token registry loads correctly.
  await test("token registry setup", async () => {
    // No token registry on testnet
    assert.strictEqual(tokenRegistry.getTokenList(chain.id).size, 0);
  });
});
