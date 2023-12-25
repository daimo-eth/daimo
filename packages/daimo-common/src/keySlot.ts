import { assert } from "./assert";

export enum SlotType {
  Phone = "Phone",
  Computer = "Computer",
  PasskeyBackup = "Passkey Backup",
}

const slotTypeToFirstSlot = {
  [SlotType.Phone]: 0,
  [SlotType.Computer]: 0x40,
  [SlotType.PasskeyBackup]: 0x80,
};

// Top two bits of slot denote the type.
export function getSlotType(slot: number): SlotType | undefined {
  if (slot > 255) return undefined;

  const slotType = slot & 0xc0;

  const isSlotType = (type: SlotType) =>
    (slotType & slotTypeToFirstSlot[type]) === slotTypeToFirstSlot[type];

  if (isSlotType(SlotType.PasskeyBackup)) return SlotType.PasskeyBackup;
  else if (isSlotType(SlotType.Computer)) return SlotType.Computer;
  else if (isSlotType(SlotType.Phone)) return SlotType.Phone;
  else return undefined;
}

// slots 0 - 63 are for mobile devices
// slots 64 - 127 are for computer devices
// slots 128 - 255 are for passkey backups
export function getSlotLabel(slot: number): string {
  const slotType = getSlotType(slot);
  assert(slotType !== undefined, "Invalid slot");

  const index = slot - slotTypeToFirstSlot[slotType] + 1;
  return index === 1 ? slotType : `${slotType} ${index}`;
}

export function findUnusedSlot(allUsedSlots: number[], type: SlotType): number {
  const typeUsedSlots = allUsedSlots.filter(
    (slot) => getSlotType(slot) === type
  );

  if (typeUsedSlots.length === 0) {
    return slotTypeToFirstSlot[type];
  }

  const maxSlot = Math.max.apply(null, typeUsedSlots);
  if (getSlotType(maxSlot + 1) === type) return maxSlot + 1;
  else {
    // return first unused slot
    for (let i = slotTypeToFirstSlot[type]; i < 256; i++) {
      if (!typeUsedSlots.includes(i) && getSlotType(i) === type) return i;
    }

    // Max active keys on contract is 20, so this should never happen
    throw new Error("No unused slots");
  }
}
