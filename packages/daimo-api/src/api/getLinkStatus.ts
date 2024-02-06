import {
  DaimoInviteStatus,
  DaimoLinkRequest,
  DaimoLinkStatus,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestStatus,
  EAccount,
  assert,
  dollarsToAmount,
  parseDaimoLink,
} from "@daimo/common";
import { DaimoNonceMetadata, DaimoNonceType } from "@daimo/userop";

import { CoinIndexer } from "../contract/coinIndexer";
import { Faucet } from "../contract/faucet";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { OpIndexer } from "../contract/opIndexer";
import { chainConfig } from "../env";

export async function getLinkStatus(
  url: string,
  nameReg: NameRegistry,
  opIndexer: OpIndexer,
  coinIndexer: CoinIndexer,
  noteIndexer: NoteIndexer,
  faucet: Faucet
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
      const ret = noteIndexer.getNoteStatusDeprecatedLink(link.ephemeralOwner);
      if (ret == null) {
        const sender = await nameReg.getEAccountFromStr(link.previewSender);
        if (sender == null) {
          throw new Error(`Note sender not found: ${link.previewSender}`);
        }
        const pending: DaimoNoteStatus = {
          status: DaimoNoteState.Pending,
          contractAddress: chainConfig.notesV2Address,
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
      const ret = noteIndexer.getNoteStatusById(sender.addr, link.id);
      if (ret == null) {
        const pending: DaimoNoteStatus = {
          status: DaimoNoteState.Pending,
          contractAddress: chainConfig.notesV2Address,
          ephemeralOwner: undefined,
          link,
          sender,
          id: link.id,
          dollars: link.dollars,
        };
        return pending;
      }
      return ret;
    }

    case "invite": {
      const inviteCode = link.code;
      const isValid = await faucet.verifyInviteCode(inviteCode);
      const ret: DaimoInviteStatus = {
        link,
        isValid,
      };
      return ret;
    }

    case "tag": {
      // Tag links serve as simple redirects to other links on the API level.
      // Currently, they get redirected to returning a request status.
      const id = link.id;
      if (id === "rwe") {
        const randomRequestId = `${BigInt(
          Math.floor(Math.random() * 1e12)
        )}` as `${bigint}`;
        const acc = await nameReg.getEAccountFromStr("daimo");
        assert(acc != null && acc.name != null);

        const requestLink: DaimoLinkRequest = {
          type: "request",
          recipient: acc.name,
          dollars: "1",
          requestId: randomRequestId,
        };

        const ret: DaimoRequestStatus = {
          link: requestLink,
          recipient: acc,
          requestId: randomRequestId,
        };
        return ret;
      } else {
        throw new Error(`Unknown tag id: ${id}`);
      }
    }

    default:
      throw new Error(`Invalid Daimo app link: ${url}`);
  }
}
