import { ReceivingAddress, ReceivingAddressType } from "@daimo/common";

import { landlineTrpc } from "../landline/trpc";

export async function createReceivingAddress(
  type: ReceivingAddressType,
  daimoAddr: string
): Promise<ReceivingAddress> {
  try {
    // TODO: Call into landline API to create a new receiving address
    // const { address } = await landlineTrpc.receivingAddress.mutate({
    //   daimoAddr,
    //   type,
    // });
    // return { type, address };
    return {
      type: "tron",
      address: "0x0000000000000000000000000000000000000000",
      status: "needs-kyc",
    };
  } catch (e) {
    console.error(`[API] error creating receiving address: ${e}`);
    throw e;
  }
}
