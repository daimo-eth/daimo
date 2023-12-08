import { UserOpHex } from "@daimo/common";
import assert from "node:assert";
import test from "node:test";
import { concatHex, hexToBytes, numberToHex, stringToHex } from "viem";

import {
  CompressionInfo,
  compressBundle,
} from "../src/network/bundleCompression";

/// Basic test. Compresses a single userop, ensures correct output.
/// For the opposite test, see BundleBulker.t.sol in the bulk repo.
test("compress example bundle", () => {
  const input: UserOpHex = {
    sender: "0x8bFfa71A959AF0b15C6eaa10d244d80BF23cb6A2",
    nonce: "0x501c58693b65f1374631a2fca7bb7dc60000000000000000",
    initCode: "0x",
    callData: concatHex([
      "0x34fcd5be", // executeBatch
      "0x0000000000000000000000000000000000000000000000000000000000000020",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000000000000000000000000000020",
      "0x000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000000000000000000000000060",
      "0x0000000000000000000000000000000000000000000000000000000000000044",
      "0xa9059cbb", // transfer
      "0x000000000000000000000000a1b349c566c44769888948adc061abcdb54497f7",
      "0x00000000000000000000000000000000000000000000000000000000000f4240",
      "0x00000000000000000000000000000000000000000000000000000000",
    ]),
    callGasLimit: numberToHex(300000),
    verificationGasLimit: numberToHex(700000),
    preVerificationGas: numberToHex(8078499),
    maxFeePerGas: numberToHex(1000050),
    maxPriorityFeePerGas: numberToHex(1000000),
    paymasterAndData: concatHex([
      "0x6f0F82fAFac7B5D8C269B02d408F094bAC6CF877",
      "0x99",
      "0x7777777777777777777777777777777777777777777777777777777777777777",
      "0x8888888888888888888888888888888888888888888888888888888888888888",
      "0x00006553c999",
    ]),
    signature: concatHex([
      "0x01",
      "0x00006553c75f",
      "0x00",
      "0x0000000000000000000000000000000000000000000000000000000000000020",
      "0x00000000000000000000000000000000000000000000000000000000000000c0",
      "0x0000000000000000000000000000000000000000000000000000000000000120",
      "0x0000000000000000000000000000000000000000000000000000000000000017",
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0xce1a2a89ec9d3cecd1e9fd65808d85702d7f8681d42ce8f0982363a362b87bd5",
      "0x498c72f497f9d27ae895c6d2c10a73e85b73d258371d2322c80ca5bfad242f5f",
      "0x0000000000000000000000000000000000000000000000000000000000000025",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x0500000000000000000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000000000000000000000000000005a",
      stringToHex(
        '{"type":"webauthn.get","challenge":"AQAAZVPHX0VzpTcrm5fZhFP_VciTT3XMWHH2bNzjd54e1wN5M2io"}'
      ),
      "0x000000000000",
    ]),
  };

  const info: CompressionInfo = {
    inflatorAddr: "0xdead",
    inflatorID: 7,
    inflatorCoinAddr: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    inflatorPaymaster: "0x6f0F82fAFac7B5D8C269B02d408F094bAC6CF877",
  };

  const expectedCompressed = concatHex([
    "0x00000007", // inflator ID

    // Everything below is passed to DaimoTransferInflator
    "0x8bffa71a959af0b15c6eaa10d244d80bf23cb6a2", // sender
    "0x501c58693b65f1374631a2fca7bb7dc6", // nonce
    "0x007b44a3", // preVerificationGas
    "0x0000000f4272", // maxFeePerGas
    "0x0000000f4240", // maxPriorityFeePerGas
    "0xa1b349c566c44769888948adc061abcdb54497f7", // to
    "0x0000000f4240", // amount
    "0x0100006553c75f00", // sig version, validUntil, keySlot
    "0xce1a2a89ec9d3cecd1e9fd65808d85702d7f8681d42ce8f0982363a362b87bd5", // sig r
    "0x498c72f497f9d27ae895c6d2c10a73e85b73d258371d2322c80ca5bfad242f5f", // sig s
    "0x415141415A5650485830567A705463726D35665A6846505F566369545433584D57484832624E7A6A6435346531774E354D32696F", // authenticatorChallenge

    // Below is OPTIONAL paymaster data. Most paymasters don't need this.
    // Even sponsoring paymasters are possible without an extra signature with tricks.
    "0x99", // paymaster sig v
    "0x7777777777777777777777777777777777777777777777777777777777777777", // paymaster sig r
    "0x8888888888888888888888888888888888888888888888888888888888888888", // paymaster sig s
    "0x00006553c999", // paymaster ticket validUntil
  ]);

  const actual = compressBundle(input, info);

  assert.deepEqual(hexToBytes(actual), hexToBytes(expectedCompressed));
});
