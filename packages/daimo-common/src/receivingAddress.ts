export type ReceivingAddressType = "tron";
export type ReceivingAddressStatus = "needs-kyc" | "active";

/** A remote receiving address, e.g. a Tron address. */
export interface ReceivingAddress {
  type: ReceivingAddressType;
  address: string;
  status: ReceivingAddressStatus;
}
