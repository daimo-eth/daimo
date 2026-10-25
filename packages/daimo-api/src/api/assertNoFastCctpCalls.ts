import { daimoAccountAbi, daimoFastCctpAddrs } from "@daimo/contract";
import { TRPCError } from "@trpc/server";
import {
  Hex,
  decodeFunctionData,
  getAbiItem,
  getAddress,
  getFunctionSelector,
} from "viem";

const executeBatchAbi = getAbiItem({
  abi: daimoAccountAbi,
  name: "executeBatch",
});
const executeBatchSelector = getFunctionSelector(executeBatchAbi);

/** FastCCTP recovery is manual; the app must only withdraw on Base. */
export function assertNoFastCctpCalls(callData: Hex) {
  if (callData.slice(0, 10).toLowerCase() !== executeBatchSelector) return;

  let calls;
  try {
    const { args } = decodeFunctionData({
      abi: [executeBatchAbi],
      data: callData,
    });
    [calls] = args;
  } catch (cause) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "invalid account batch",
      cause,
    });
  }

  if (
    calls.some((call) => daimoFastCctpAddrs.includes(getAddress(call.dest)))
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cross-chain unsupported. Please withdraw on Base",
    });
  }
}
