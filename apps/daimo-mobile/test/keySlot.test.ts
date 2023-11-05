import { SlotType, findUnusedSlot, getSlotLabel } from "../src/logic/keySlot";

const testCases: [number, string][] = [
  [0, "Phone A"],
  [25, "Phone Z"],
  [26, "Phone AA"],
  [129, "Passkey Backup B"],
  [65, "Computer B"],
];

describe("Device", () => {
  it("describes identifiers correctly", () => {
    for (const [keyData, expected] of testCases) {
      expect(getSlotLabel(keyData)).toEqual(expected);
    }
  });

  it("finds unused slot", () => {
    expect(findUnusedSlot([], SlotType.Phone)).toEqual(0);
    expect(findUnusedSlot([0], SlotType.Phone)).toEqual(1);
    expect(findUnusedSlot([0, 1], SlotType.PasskeyBackup)).toEqual(128);
    expect(findUnusedSlot([0, 1], SlotType.Computer)).toEqual(64);
    expect(findUnusedSlot([0, 2], SlotType.Phone)).toEqual(3);
    expect(findUnusedSlot([0, 255], SlotType.Phone)).toEqual(1);
    expect(findUnusedSlot([0, 1, 2, 4, 5, 6, 7, 8, 9], SlotType.Phone)).toEqual(
      10
    );
    expect(
      findUnusedSlot(
        [...Array(64).keys()].filter((i) => i !== 5), // All mobile slots except 5 are taken
        SlotType.Phone
      )
    ).toEqual(5);
  });
});
