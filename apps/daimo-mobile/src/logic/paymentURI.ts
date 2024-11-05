import { BigIntStr } from "@daimo/common";
import { polygonUSDC } from "@daimo/contract";
import { isAddress, getAddress } from "viem";

export function parsePaymentUri(uri: string) {
  const [protocol, rest] = uri.split(":");
  if (protocol !== "ethereum") throw new Error("Invalid protocol");

  const [tokenAddressAndChain, pathAndQuery] = rest.split("/");
  const [tokenAddress, chainId] = tokenAddressAndChain.split("@");
  if (
    !isAddress(tokenAddress) ||
    getAddress(tokenAddress) !== polygonUSDC.token
  ) {
    throw new Error("Invalid token address");
  }
  if (!chainId || chainId !== "137") {
    throw new Error("Unsupported chain ID");
  }

  const [path, queryString] = pathAndQuery.split("?");
  if (path !== "transfer") throw new Error("Invalid path");

  const params = new URLSearchParams(queryString);
  const recipientAddress = params.get("address");
  const amount = params.get("uint256");

  if (!recipientAddress || !isAddress(recipientAddress)) {
    throw new Error("Invalid recipient address");
  }
  if (!amount) throw new Error("Missing amount");

  return {
    recipientAddress: getAddress(recipientAddress),
    amount: BigInt(Number(amount)).toString() as BigIntStr,
  };
}
