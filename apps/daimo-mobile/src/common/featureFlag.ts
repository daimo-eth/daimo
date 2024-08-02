import { Account } from "../storage/account";

export class FeatFlag {
  public static sendAnyCoin(account: Account) {
    return ["dcposch", "klee", "andrewliu"].includes(account.name);
  }
}
