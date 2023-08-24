import { findUnusedSlot, keySlotToDeviceIdentifier } from "../src/logic/device";

const testCases: [number, string][] = [
  [0, "A"],
  [25, "Z"],
  [26, "AA"],
  [27, "AB"],
  [254, "IU"],
];

describe("Device", () => {
  it("describes identifiers correctly", () => {
    for (const [keyData, expected] of testCases) {
      expect(keySlotToDeviceIdentifier(keyData)).toEqual(expected);
    }
  });

  it("finds unused slot", () => {
    expect(findUnusedSlot([])).toEqual(0);
    expect(findUnusedSlot([0])).toEqual(1);
    expect(findUnusedSlot([0, 1])).toEqual(2);
    expect(findUnusedSlot([0, 2])).toEqual(3);
    expect(findUnusedSlot([0, 255])).toEqual(1);
    expect(findUnusedSlot([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual(10);
    expect(findUnusedSlot([0, 1, 2, 4, 5, 6, 7, 8, 9, 255])).toEqual(3);
  });
});
