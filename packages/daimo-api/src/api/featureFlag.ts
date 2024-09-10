import { EAccount } from "@daimo/common";

export class FeatFlag {
  public static landline(account: EAccount & { name: string }) {
    return [
      "dcposch",
      "klee",
      "andrewliu",
      "nibnalin",
      "hanna",
      "sfl",
    ].includes(account.name);
  }
}
