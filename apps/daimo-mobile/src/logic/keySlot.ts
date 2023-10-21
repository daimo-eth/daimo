import { assert } from "@daimo/common";

// slots 0 - 127 are for devices, 128 - 255 are for passkeys

export function isPasskeySlot(slot: number): boolean {
  return (slot & 0x80) === 0x80;
}

export function keySlotTokeyLabel(slot: number): string {
  if (isPasskeySlot(slot)) {
    return "Passkey " + String.fromCharCode(65 + slot - 0x80);
  } else {
    return "Device " + String.fromCharCode(65 + slot);
  }
}

export function findUnusedSlot(
  slots: number[],
  variant: "Device" | "Passkey"
): number {
  slots = slots.filter(
    (slot) => isPasskeySlot(slot) === (variant === "Passkey")
  );
  if (slots.length === 0) return variant === "Device" ? 0 : 0x80;
  const maxSlot = Math.max.apply(null, slots);
  if (maxSlot + 1 < 255) {
    assert(isPasskeySlot(maxSlot) === (variant === "Passkey"));
    return maxSlot + 1;
  } else {
    // maxActivekeys on contract is 20
    throw new Error("no unused slot");
  }
}
