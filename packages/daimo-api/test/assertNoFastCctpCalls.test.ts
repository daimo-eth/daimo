import { DaimoAccountCall } from "@daimo/common";
import {
  daimoAccountAbi,
  daimoFastCctpAddrs,
  daimoFastCctpV1Abi,
  erc20Abi,
} from "@daimo/contract";
import { TRPCError } from "@trpc/server";
import assert from "node:assert/strict";
import test from "node:test";
import { encodeFunctionData } from "viem";

import { assertNoFastCctpCalls } from "../src/api/assertNoFastCctpCalls";

const baseUsdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const recipient = "0xd5B79A8b472b941b131a3Eb2f9C4c9E4b0C6DcE9";
const withdrawal: DaimoAccountCall = {
  dest: baseUsdc,
  value: 0n,
  data: encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, 907_000_000n],
  }),
};

test("rejects FastCCTP V0/V1 starts anywhere in an account batch", () => {
  for (const dest of daimoFastCctpAddrs) {
    const start: DaimoAccountCall = {
      dest,
      value: 0n,
      data: encodeFunctionData({
        abi: daimoFastCctpV1Abi,
        functionName: "startTransfer",
        args: [
          "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
          baseUsdc,
          907_000_000n,
          42161n,
          3,
          recipient,
          "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
          907_000_000n,
          1n,
        ],
      }),
    };
    for (const calls of [[start], [withdrawal, start], [start, withdrawal]]) {
      assert.throws(
        () => assertNoFastCctpCalls(batch(calls)),
        (error: unknown) =>
          error instanceof TRPCError &&
          error.code === "BAD_REQUEST" &&
          error.message === "Cross-chain unsupported. Please withdraw on Base"
      );
    }
  }
});

test("allows Base USDC withdrawals and empty batches", () => {
  assert.doesNotThrow(() => assertNoFastCctpCalls(batch([withdrawal])));
  assert.doesNotThrow(() => assertNoFastCctpCalls(batch([])));
});

test("leaves account key management unchanged", () => {
  const callData = encodeFunctionData({
    abi: daimoAccountAbi,
    functionName: "removeSigningKey",
    args: [1],
  });
  assert.doesNotThrow(() => assertNoFastCctpCalls(callData));
});

test("rejects malformed batches with a controlled error", () => {
  assert.throws(
    () => assertNoFastCctpCalls("0x34fcd5be"),
    (error: unknown) =>
      error instanceof TRPCError &&
      error.code === "BAD_REQUEST" &&
      error.message === "invalid account batch"
  );
});

function batch(calls: DaimoAccountCall[]) {
  return encodeFunctionData({
    abi: daimoAccountAbi,
    functionName: "executeBatch",
    args: [calls],
  });
}
