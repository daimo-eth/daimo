import { assert } from "@daimo/common";

export enum SlotType {
  Mobile = "Mobile",
  Computer = "Computer",
  Backup = "Backup",
}

const slotTypeToFirstSlot = {
  [SlotType.Mobile]: 0,
  [SlotType.Computer]: 0x40,
  [SlotType.Backup]: 0x80,
};

// Top two bits of slot denote the type.
function getSlotType(slot: number): SlotType | undefined {
  if (slot > 255) return undefined;

  const slotType = slot & 0xc0;

  const isSlotType = (type: SlotType) =>
    (slotType & slotTypeToFirstSlot[type]) === slotTypeToFirstSlot[type];

  if (isSlotType(SlotType.Backup)) return SlotType.Backup;
  else if (isSlotType(SlotType.Computer)) return SlotType.Computer;
  else if (isSlotType(SlotType.Mobile)) return SlotType.Mobile;
  else return undefined;
}

// diff is the index of key wrt first slot of its type
// convert diff to a human readable string (A, B, C, ... Z, AA, AB, ...)
function getSlotCharCode(diff: number): string {
  const base = 26;
  let result = "";
  let n = diff + 1; // 1-indexed
  while (n > 0) {
    const rem = (n - 1) % base;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / base);
  }
  return result;
}

// slots 0 - 63 are for mobile devices
// slots 64 - 127 are for computer devices
// slots 128 - 255 are for passkey backups
export function getSlotLabel(slot: number): string {
  const slotType = getSlotType(slot);
  assert(slotType !== undefined, "Invalid slot");

  const prefix = slotType + " ";
  return prefix + getSlotCharCode(slot - slotTypeToFirstSlot[slotType]);
}

export function findUnusedSlot(
  allUsedSlots: number[],
  variant: SlotType
): number {
  const variantUsedSlots = allUsedSlots.filter(
    (slot) => getSlotType(slot) === variant
  );

  if (variantUsedSlots.length === 0) {
    return slotTypeToFirstSlot[variant];
  }

  const maxSlot = Math.max.apply(null, variantUsedSlots);
  if (getSlotType(maxSlot + 1) === variant) return maxSlot + 1;
  else {
    // return first unused slot
    for (let i = slotTypeToFirstSlot[variant]; i < 256; i++) {
      if (!variantUsedSlots.includes(i) && getSlotType(i) === variant) return i;
    }

    // Max active keys on contract is 20, so this should never happen
    throw new Error("No unused slots");
  }
}
