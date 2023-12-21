import {
  DaimoLinkStatus,
  DaimoNoteStatus,
  DaimoRequestStatus,
  EAccount,
  dollarsToAmount,
  parseDaimoLink,
} from "@daimo/common";
import { DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";

import { CoinIndexer } from "../contract/coinIndexer";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { OpIndexer } from "../contract/opIndexer";

export async function getLinkStatus(
  url: string,
  nameReg: NameRegistry,
  opIndexer: OpIndexer,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer
): Promise<DaimoLinkStatus> {
  const link = parseDaimoLink(url);
  if (link == null) {
    throw new Error(`Invalid Daimo app link: ${url}`);
  }

  async function getEAccountFromStr(eAccStr: string): Promise<EAccount> {
    const ret = await nameReg.getEAccountFromStr(eAccStr);
    if (ret == null) throw new Error(`${eAccStr} not found`);
    return ret;
  }

  switch (link.type) {
    case "account": {
      const acc = await getEAccountFromStr(link.account);
      return { link, account: acc };
    }
    case "request": {
      const acc = await getEAccountFromStr(link.recipient);

      // Check if already fulfilled
      const fulfilledNonceMetadata = new DaimoNonceMetadata(
        DaimoNonceType.RequestResponse,
        BigInt(link.requestId)
      );
      const potentialFulfillTxes = opIndexer.fetchTxHashes(
        fulfilledNonceMetadata
      );
      const relevantTransfers = coinIndexer.filterTransfers({
        addr: acc.addr,
        txHashes: potentialFulfillTxes,
      });
      const expectedAmount = dollarsToAmount(parseFloat(link.dollars));
      const fulfillTxes = relevantTransfers.filter(
        (t) => t.to === acc.addr && BigInt(t.amount) === expectedAmount
      );
      const fulfilledBy =
        fulfillTxes.length > 0
          ? await nameReg.getEAccount(fulfillTxes[0].from)
          : undefined;

      const ret: DaimoRequestStatus = {
        link,
        recipient: acc,
        requestId: link.requestId,
        fulfilledBy,
      };
      return ret;
    }

    case "note": {
      const ret = noteIndexer.getNoteStatusByOwner(link.ephemeralOwner);
      if (ret == null) {
        const sender = await nameReg.getEAccountFromStr(link.previewSender);
        if (sender == null) {
          throw new Error(`Note sender not found: ${link.previewSender}`);
        }
        const pending: DaimoNoteStatus = {
          status: "pending",
          ephemeralOwner: link.ephemeralOwner,
          link,
          sender,
          dollars: link.previewDollars,
        };
        return pending;
      }
      return ret;
    }

    case "notev2": {
      const sender = await nameReg.getEAccountFromStr(link.sender);
      if (sender == null) {
        throw new Error(`Note sender not found: ${link.sender}`);
      }
      const ret = noteIndexer.getNoteStatusBySeq(sender.addr, link.seq);
      if (ret == null) {
        const pending: DaimoNoteStatus = {
          status: "pending",
          ephemeralOwner: undefined,
          link,
          sender,
          seq: link.seq,
          dollars: link.dollars,
        };
        return pending;
      }
      return ret;
    }

    default:
      throw new Error(`Invalid Daimo app link: ${url}`);
  }
}
