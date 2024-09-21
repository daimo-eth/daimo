import { EAccount } from "@daimo/common";

export class FeatFlag {
  public static tronramp(account: EAccount) {
    return [
      "dcposch",
      "klee",
      "andrewliu",
      "nibnalin",
      "hanna",
      "sfl",
      "sbg",
      "ansgar",
      "liam",
    ].includes(account.name || "");
  }
}
