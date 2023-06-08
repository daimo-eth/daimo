import { Address, Hex } from "viem";
import { z } from "zod";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export const zNamedAccount = z.object({
  name: z.string(),
  addr: zAddress,
});

export type NamedAccount = z.infer<typeof zNamedAccount>;

export const zHex = z
  .string()
  .regex(/^0x([0-9a-f]{2})*$/i)
  .refine((s): s is Hex => true);
