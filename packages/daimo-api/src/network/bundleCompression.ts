import { UserOpHex } from "@daimo/common";
import {
  Address,
  Hex,
  concatHex,
  getAddress,
  hexToBigInt,
  hexToBytes,
  numberToHex,
  stringToHex,
  toHex,
} from "viem";

import { NameRegistry } from "../contract/nameRegistry";

// See https://github.com/daimo-eth/bulk
export interface CompressionInfo {
  inflatorAddr: Address;
  inflatorID: number;
  opInflatorID: number;
  opInflatorCoinAddr: Address;
  opInflatorPaymaster: Address;
}

export function compressBundle(
  op: UserOpHex,
  info: CompressionInfo,
  nameReg: NameRegistry
) {
  if (info.inflatorID === 0) {
    throw new Error(`can't compress. register inflator ${info.inflatorAddr}`);
  }

  const opHex = compressOp(op, info, nameReg);

  const ret: Hex[] = [
    numberToHex(info.inflatorID, { size: 4 }),
    numberToHex(1, { size: 1 }), // 1 op
    numberToHex(info.opInflatorID, { size: 4 }), // ops[0] inflator ID
    numberToHex(hexToBytes(opHex).length, { size: 2 }), // ops[0] length
    opHex,
  ];

  return concatHex(ret);
}

function compressOp(
  op: UserOpHex,
  info: CompressionInfo,
  nameReg: NameRegistry
) {
  const ret: Hex[] = [];

  // sender
  ret.push(compressAddr(getAddress(op.sender), nameReg));

  // callData: ERC20 transfer
  const calldataRegex = new RegExp(
    [
      "^",
      "0x34fcd5be", // executeBatch
      "0000000000000000000000000000000000000000000000000000000000000020",
      "0000000000000000000000000000000000000000000000000000000000000001",
      "0000000000000000000000000000000000000000000000000000000000000020",
      "000000000000000000000000" + info.opInflatorCoinAddr.slice(2),
      "0000000000000000000000000000000000000000000000000000000000000000",
      "0000000000000000000000000000000000000000000000000000000000000060",
      "0000000000000000000000000000000000000000000000000000000000000044",
      "a9059cbb", // transfer
      "000000000000000000000000(.{40})",
      "0000000000000000000000000000000000000000000000000000(.{12})",
      "00000000000000000000000000000000000000000000000000000000",
      "$",
    ].join(""),
    "i"
  );
  let m = calldataRegex.exec(op.callData);
  if (!m) throw new Error("can't compress, bad callData: " + op.callData);
  const toAddr = getAddress(`0x${m[1]}`);
  const amountHex = `0x${m[2]}` as Hex;
  ret.push(compressAddr(toAddr, nameReg));

  // nonce
  m = /^0x(.*)0{16}$/i.exec(op.nonce);
  if (!m) throw new Error("can't compress, bad nonce: " + op.nonce);
  ret.push(numberToHex(hexToBigInt(`0x${m[1]}`), { size: 16 }));

  // gas
  ret.push(toHex(hexToBigInt(op.preVerificationGas), { size: 4 }));
  ret.push(toHex(hexToBigInt(op.maxFeePerGas), { size: 6 }));
  ret.push(toHex(hexToBigInt(op.maxPriorityFeePerGas), { size: 6 }));

  // transfer amount
  ret.push(amountHex); // amount

  // op signature
  const sigRegex = new RegExp(
    [
      "^",
      "0x(.{16})", // sig version, validUntil, keySlot
      "0000000000000000000000000000000000000000000000000000000000000020",
      "00000000000000000000000000000000000000000000000000000000000000c0",
      "0000000000000000000000000000000000000000000000000000000000000120",
      "0000000000000000000000000000000000000000000000000000000000000017",
      "0000000000000000000000000000000000000000000000000000000000000001",
      "(.{64})", // sig r
      "(.{64})", // sig s
      "0000000000000000000000000000000000000000000000000000000000000025",
      "0000000000000000000000000000000000000000000000000000000000000000",
      "0500000000000000000000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000000000000000000005a",
      stringToHex('{"type":"webauthn.get","challenge":"').slice(2),
      "(.{104})", // authenticator challenge
      stringToHex('"}').slice(2),
      "000000000000",
      "$",
    ].join(""),
    "i"
  );
  m = sigRegex.exec(op.signature);
  if (!m) throw new Error("can't compress, bad signature: " + op.signature);
  ret.push(`0x${m[1]}`); // sig version, validUntil, keySlot
  ret.push(`0x${m[2]}`); // sig r
  ret.push(`0x${m[3]}`); // sig s
  // no authenticator challenge. reconstructed in DaimoOpInflator.

  // paymaster signature, if present
  const paymasterAddr = info.opInflatorPaymaster;
  const paymasterRegex = new RegExp(`${paymasterAddr}(.*)$`, "i");
  m = paymasterRegex.exec(op.paymasterAndData);
  if (!m) throw new Error("can't compress, bad paym.:" + op.paymasterAndData);
  if (m[1].length > 0) throw new Error("can't compress, has paymasterData");

  return concatHex(ret);
}

function compressAddr(addr: Address, nameReg: NameRegistry) {
  const name = nameReg.resolveDaimoNameForAddr(addr);
  if (name == null) throw new Error(`can't compress, not a daimo acc: ${addr}`);

  // Represent as bytes(length) + name in ascii
  const nameBytes = stringToHex(name);
  const nameLen = numberToHex(name.length, { size: 1 });
  return concatHex([nameLen, nameBytes]);
}
