import { assert, getSessionSecretSigningMessage } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { stringToBytes } from "viem";

import { env } from "./env";
import { signAsync } from "../action/sign";
import { Account } from "../model/account";

export async function validateSessionKeyWithSignature(account: Account) {
  assert(account.sessionSecret != null, "No session secret");

  const message = getSessionSecretSigningMessage(account.sessionSecret);
  const messageBytes = stringToBytes(message);
  const signature = await signAsync({ account, messageBytes });

  const rpcFunc = env(daimoChainFromId(account.homeChainId)).rpcFunc;
  await rpcFunc.registerExistingDeviceSession.mutate({
    addr: account.address,
    deviceSecret: account.sessionSecret,
    devicePubkey: account.enclavePubKey,
    signature,
  });
}
