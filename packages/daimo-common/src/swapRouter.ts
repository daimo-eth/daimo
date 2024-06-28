import { Address, getAddress } from "viem";

import { assert } from "./assert";
import {
  arbitrum,
  avalanche,
  base,
  isTestnetChain,
  optimism,
  polygon,
} from "./chain";

/**
 * Stores Uniswap router deployment addresses.
 * Reference: https://docs.uniswap.org/contracts/v3/reference/deployments
 */

/** Retrieve the address of the Uniswap router for a given chain. */
export function getUniswapRouterAddress(chainId: number): Address {
  assert(!isTestnetChain(chainId));
  switch (chainId) {
    case base.chainId:
      return BASE_UNISWAP_V3_02_ROUTER_ADDRESS;
    case avalanche.chainId:
      return AVALANCHE_UNISWAP_V3_02_ROUTER_ADDRESS;
    case polygon.chainId:
      return POLYGON_UNISWAP_V3_02_ROUTER_ADDRESS;
    case optimism.chainId:
      return OPTIMISM_UNISWAP_V3_02_ROUTER_ADDRESS;
    case arbitrum.chainId:
      return ARBITRUM_UNISWAP_V3_02_ROUTER_ADDRESS;
    default:
      throw new Error(`Uniswap router not supported on chain ${chainId}`);
  }
}

const BASE_UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x2626664c2603336E57B271c5C0b26F421741e481"
);

const AVALANCHE_UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE"
);

const POLYGON_UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
);

const OPTIMISM_UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
);

const ARBITRUM_UNISWAP_V3_02_ROUTER_ADDRESS = getAddress(
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
);
