import { assert } from "@daimo/common";
import {
  Hex,
  Transport,
  fallback,
  hexToBigInt,
  http,
  isHex,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getEnvApi } from "../env";

export function getTransportFromEnv() {
  const l1RPCs = getEnvApi().DAIMO_API_L1_RPC_WS.split(",");
  const l2RPCs = getEnvApi().DAIMO_API_L2_RPC_WS.split(",");

  console.log(`[VIEM] using transport RPCs L1: ${l1RPCs}, L2: ${l2RPCs}`);

  const stringToTransport = (url: string) => {
    const rpc = url.startsWith("wss") ? webSocket(url) : http(url);
    return addLogging(rpc, url);
  };

  return {
    l1: fallback(l1RPCs.map(stringToTransport), { rank: true }),
    l2: fallback(l2RPCs.map(stringToTransport), { rank: true }),
  };
}

// Log JSON RPC requests. This helps debug RPC errors.
export function addLogging(transport: Transport, url: string) {
  return (args: Parameters<Transport>[0]) => {
    const chainId = args.chain?.id;
    const ret = transport(args);
    const { request } = ret;
    ret.request = async (args) => {
      const reqID = Math.floor(Math.random() * 1e6).toString(36);
      const { method } = args;
      console.log(`[VIEM] request ${chainId} ${method} ${reqID} ${url}`);
      try {
        const resp = (await request(args)) as any;
        const detail =
          method === "eth_blockNumber" ? ` ${hexToBigInt(resp as Hex)}` : "";
        console.log(`[VIEM] response ${chainId} ${method} ${reqID}${detail}`);
        return resp;
      } catch (e) {
        console.error(`[VIEM] ERROR ${chainId} ${method} ${reqID}`, e);
        throw e;
      }
    };
    return ret;
  };
}

export function getEOA(privateKey: string) {
  if (!privateKey.startsWith("0x")) privateKey = `0x${privateKey}`;
  assert(isHex(privateKey) && privateKey.length === 66, "Invalid private key");

  return privateKeyToAccount(privateKey);
}

/**
 * Parse an error message from a Viem error.
 */
function parseErrorMessage(error: unknown): string | null {
  return error && typeof error === "object" && "message" in error
    ? (error.message as string)
    : null;
}

/**
 * Check if an error is due to a replacement gas fee being too low.
 */
export function isReplacementGasFeeTooLowError(error: unknown): boolean {
  const message = parseErrorMessage(error);
  const errorPhrases = ["replacement fee too low", "transaction underpriced"];

  if (message) {
    return errorPhrases.some((phrase) =>
      message.toLowerCase().includes(phrase)
    );
  }

  return false;
}

/**
 * Check if Viem timed out waiting for a transaction receipt.
 */
export function isWaitForReceiptTimeoutError(error: unknown): boolean {
  const message = parseErrorMessage(error);
  const errorPhrases = ["timed out while waiting for transaction"];

  if (message) {
    return errorPhrases.some((phrase) =>
      message.toLowerCase().includes(phrase)
    );
  }

  return false;
}

/**
 * Check if an error is due to a nonce already being used.
 */
export function isNonceAlreadyUsedError(error: unknown): boolean {
  const message = parseErrorMessage(error);
  const errorPhrases = ["nonce too low"];

  if (message) {
    return errorPhrases.some((phrase) =>
      message.toLowerCase().includes(phrase)
    );
  }

  return false;
}
