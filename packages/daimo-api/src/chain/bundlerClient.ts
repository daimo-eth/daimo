import { UserOpHex, assert } from "@daimo/common";
import { BundlerJsonRpcProvider, Constants } from "userop";
import { isHex } from "viem";

/** Sends userops through an ERC-4337 bundler. */
export class BundlerClient {
  provider: BundlerJsonRpcProvider;

  constructor(bundlerRpcUrl: string) {
    this.provider = new BundlerJsonRpcProvider(bundlerRpcUrl);
  }

  async sendUserOp(op: UserOpHex) {
    console.log(`[BUNDLER] submitting userOp: ${JSON.stringify(op)}`);
    const args = [op, Constants.ERC4337.EntryPoint];
    const opHash = await this.provider.send("eth_sendUserOperation", args);
    assert(isHex(opHash));
    console.log(`[BUNDLER] submitted userOpHash: ${opHash}`);
    return opHash;
  }
}

/** Requires DAIMO_BUNDLER_RPC_URL. */
export function getBundlerClientFromEnv() {
  const rpcUrl = process.env.DAIMO_BUNDLER_RPC || "";
  assert(rpcUrl !== "", "DAIMO_BUNDLER_RPC env var missing");
  return new BundlerClient(rpcUrl);
}
