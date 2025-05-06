import {
  DaimoInviteCodeStatus,
  DaimoLinkStatus,
  DaimoNoteState,
  DaimoNoteStatus,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  EAccount,
  assert,
  decodeRequestIdString,
  now,
  parseDaimoLink,
} from "@daimo/common";

import { getTagRedirect } from "./tagRedirect";
import { NameRegistry } from "../contract/nameRegistry";
import { NoteIndexer } from "../contract/noteIndexer";
import { RequestIndexer } from "../contract/requestIndexer";
import { DB } from "../db/db";
import { chainConfig } from "../env";
import { InviteCodeTracker } from "../offchain/inviteCodeTracker";

export async function getLinkStatus(
  url: string,
  nameReg: NameRegistry,
  noteIndexer: NoteIndexer,
  requestIndexer: RequestIndexer,
  inviteCodeTracker: InviteCodeTracker,
  db: DB
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
      const account = await getEAccountFromStr(link.account);
      const inviter = account.inviter
        ? await nameReg.getEAccount(account.inviter)
        : undefined;
      return { link, account, inviter };
    }
    case "request": {
      const acc = await getEAccountFromStr(link.recipient);

      // Request V1 is deprecated, assume status is pending.
      const fulfilledBy = undefined;

      const ret: DaimoRequestStatus = {
        link,
        recipient: acc,
        requestId: link.requestId,
        fulfilledBy,
      };
      return ret;
    }

    case "requestv2": {
      const idString = link.id;
      const id = decodeRequestIdString(idString);
      const ret = requestIndexer.getRequestStatusById(id);
      if (ret == null) {
        const recipient = await getEAccountFromStr(link.recipient);
        const pending: DaimoRequestV2Status = {
          link,
          recipient,
          creator: undefined,
          status: DaimoRequestState.Pending,
          metadata: `0x`,
          createdAt: now(),
        };
        return pending;
      } else {
        // Re-inject offchain parts of th link, such as the memo
        return { ...ret, link };
      }
    }

    case "note": {
      const ret = noteIndexer.getNoteStatusDeprecatedLink(link.ephemeralOwner);
      if (ret == null) {
        const sender = await nameReg.getEAccountFromStr(link.previewSender);
        if (sender == null) {
          throw new Error(`Sender ${link.previewSender} not found`);
        }
        const pending: DaimoNoteStatus = {
          status: DaimoNoteState.Pending,
          contractAddress: chainConfig.notesV2Address,
          ephemeralOwner: link.ephemeralOwner,
          link,
          sender,
          dollars: link.previewDollars,
          memo: undefined, // Note V1 doesn't have memos
        };
        return pending;
      }
      return ret;
    }

    case "notev2": {
      const sender = await nameReg.getEAccountFromStr(link.sender);
      if (sender == null) {
        throw new Error(`Sender ${link.sender} not found`);
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
          memo: undefined,
          // Memo not indexed until note is indexed
          // TODO: we could fix this by storing memos by noteId, vs just opHash
        };
        return pending;
      }
      return ret;
    }

    case "invite": {
      const ret: DaimoInviteCodeStatus =
        await inviteCodeTracker.getInviteCodeStatus(link);
      return ret;
    }

    case "tag": {
      // Tag links serve as simple redirects to other links on the API level.
      // Currently, they get redirected to returning a request status.
      const id = link.id;
      const redir = await getTagRedirect(id, db);
      assert(redir != null, `Unknown tag id: ${id}`);

      const redirLink = parseDaimoLink(redir);
      assert(redirLink != null, `Invalid tag redirect: ${id} -> ${redir}`);
      assert(redirLink.type !== "tag", `Tag redirect loop: ${id} -> ${redir}`);

      const ret = await getLinkStatus(
        redir,
        nameReg,
        noteIndexer,
        requestIndexer,
        inviteCodeTracker,
        db
      );

      // For now, all tag requests are a valid invite.
      // User can scan tag > guaranteed they'll be able to install the app.
      if (ret.link.type === "request") {
        (ret as DaimoRequestStatus).isValidInvite = true;
      }
      return ret;
    }

    default:
      throw new Error(`Invalid Daimo app link: ${url}`);
  }
}
