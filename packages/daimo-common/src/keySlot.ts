import { assert } from "./assert";
import { KeyData } from "./model";

export enum SlotType {
  Phone = "Phone",
  Computer = "Computer",
  PasskeyBackup = "Passkey Backup",
  SecurityKeyBackup = "Security Key Backup",
  SeedPhraseBackup = "Seed Phrase Backup",
}

// slots 0 - 63 are for mobile devices
// slots 64 - 127 are for computer devices
// slots 128 - 160 are for passkey backups
// slots 160 - 192 are for security key backups
// slots 192 - 256 are for seed phrase backups
const slotTypeToFirstSlot = {
  [SlotType.Phone]: 0,
  [SlotType.Computer]: 0x40,
  [SlotType.PasskeyBackup]: 0x80,
  [SlotType.SecurityKeyBackup]: 0xa0,
  [SlotType.SeedPhraseBackup]: 0xc0,
};

// Top three bits of slot denote the type.
export function getSlotType(slot: number): SlotType | undefined {
  if (slot > 255) return undefined;

  const slotFirstThreeBits = slot & 0xe0;
  const isSlotType = (type: SlotType) =>
    (slotFirstThreeBits & slotTypeToFirstSlot[type]) ===
    slotTypeToFirstSlot[type];

  // slot types ordered by their first slot, descending
  const descSlotTypes = Object.values(SlotType).sort((a, b) => {
    return slotTypeToFirstSlot[b] - slotTypeToFirstSlot[a];
  });

  // Pick the largest slot type that fits
  for (const slotType of descSlotTypes) {
    if (isSlotType(slotType)) return slotType;
  }
  return undefined;
}

export function getSlotLabel(slot: number): string {
  const slotType = getSlotType(slot);
  assert(slotType !== undefined, "Invalid slot");

  const index = slot - slotTypeToFirstSlot[slotType] + 1;
  return index === 1 ? slotType : `${slotType} ${index}`;
}

export function findAccountUnusedSlot(
  account: { accountKeys: KeyData[] },
  type: SlotType
): number {
  const allUsedSlots = account.accountKeys.map((k) => k.slot);
  return findUnusedSlot(allUsedSlots, type);
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
