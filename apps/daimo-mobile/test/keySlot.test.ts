import { SlotType, findUnusedSlot, getSlotLabel } from "../src/logic/keySlot";

const testCases: [number, string][] = [
  [0, "Mobile A"],
  [25, "Mobile Z"],
  [26, "Mobile AA"],
  [129, "Backup B"],
];

describe("Device", () => {
  it("describes identifiers correctly", () => {
    for (const [keyData, expected] of testCases) {
      expect(getSlotLabel(keyData)).toEqual(expected);
    }
  });

  it("finds unused slot", () => {
    expect(findUnusedSlot([], SlotType.Mobile)).toEqual(0);
    expect(findUnusedSlot([0], SlotType.Mobile)).toEqual(1);
    expect(findUnusedSlot([0, 1], SlotType.Backup)).toEqual(128);
    expect(findUnusedSlot([0, 1], SlotType.Desktop)).toEqual(64);
    expect(findUnusedSlot([0, 2], SlotType.Mobile)).toEqual(3);
    expect(findUnusedSlot([0, 255], SlotType.Mobile)).toEqual(1);
    expect(
      findUnusedSlot([0, 1, 2, 4, 5, 6, 7, 8, 9], SlotType.Mobile)
    ).toEqual(10);
    expect(
      findUnusedSlot(
        [...Array(64).keys()].filter((i) => i !== 5), // All mobile slots except 5 are taken
        SlotType.Mobile
      )
    ).toEqual(5);
  });
});
