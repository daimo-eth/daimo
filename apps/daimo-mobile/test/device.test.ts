import { findUnusedSlot, keySlotTokeyLabel } from "../src/logic/keySlot";

const testCases: [number, string][] = [
  [0, "Device A"],
  [25, "Device Z"],
  [129, "Backup B"],
];

describe("Device", () => {
  it("describes identifiers correctly", () => {
    for (const [keyData, expected] of testCases) {
      expect(keySlotTokeyLabel(keyData)).toEqual(expected);
    }
  });

  it("finds unused slot", () => {
    expect(findUnusedSlot([], "Device")).toEqual(0);
    expect(findUnusedSlot([0], "Device")).toEqual(1);
    expect(findUnusedSlot([0, 1], "Device")).toEqual(2);
    expect(findUnusedSlot([0, 2], "Device")).toEqual(3);
    expect(findUnusedSlot([0, 255], "Device")).toEqual(1);
    expect(findUnusedSlot([0, 1, 2, 4, 5, 6, 7, 8, 9], "Device")).toEqual(10);
  });
});
