import {
  DaimoInviteCodeStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  ProposedSwap,
  now,
} from "@daimo/common";
import { useEffect, useState } from "react";

import { getAccountManager, useAccount } from "./accountManager";

type InAppNotification =
  | RequestNotification
  | InvitesNotification
  | SwapNotification;

type BaseNotification = {
  type: "request" | "invite" | "swap";
  timestamp: number;
  marksUnread: boolean;
};

export type RequestNotification = BaseNotification & {
  type: "request";
  request: DaimoRequestV2Status;
};

export type InvitesNotification = BaseNotification & {
  type: "invite";
  inviteLinkStatus: DaimoInviteCodeStatus;
};

export type SwapNotification = BaseNotification & {
  type: "swap";
  swap: ProposedSwap;
};

type InAppNotificationInfo = {
  unread: boolean;
  notifications: InAppNotification[];
  markRead: () => void;
};

export function useInAppNotifications(): InAppNotificationInfo {
  const [notifInfo, setNotifInfo] = useState<InAppNotificationInfo>({
    unread: false,
    notifications: [],
    markRead: () => {},
  });

  const account = useAccount();

  useEffect(() => {
    if (account == null) return;

    const {
      notificationRequestStatuses,
      lastReadNotifTimestamp,
      inviteLinkStatus,
    } = account;

    const notifications: InAppNotification[] = [];

    // Requests
    for (const request of notificationRequestStatuses) {
      // Skip requests we've declined or cancelled.
      if (
        request.status === DaimoRequestState.Cancelled ||
        (request.status === DaimoRequestState.Declined &&
          request.recipient.addr !== account.address)
      ) {
        continue;
      }

      // Show unread (red bubble) if someone sends us a request, or declines our request.
      const marksUnread =
        request.status === DaimoRequestState.Pending ||
        request.status === DaimoRequestState.Created ||
        (request.status === DaimoRequestState.Declined &&
          request.recipient.addr === account.address);

      notifications.push({
        type: "request",
        marksUnread,
        timestamp: request.updatedAt || request.createdAt,
        request,
      });
    }

    // Available invites
    if (inviteLinkStatus?.isValid && inviteLinkStatus.createdAt) {
      notifications.push({
        type: "invite",
        marksUnread: true,
        timestamp: inviteLinkStatus.createdAt,
        inviteLinkStatus,
      });
    }

    // Proposed swaps
    account.proposedSwaps.map((swap) => {
      console.log(`[IN-APP] pushing swap ${swap.fromCoin.token}`);
      notifications.push({
        type: "swap",
        marksUnread: true,
        timestamp: swap.receivedAt,
        swap,
      });
    });

    notifications.sort((a, b) => b.timestamp - a.timestamp);

    const unread = notifications.some(
      (n) => n.marksUnread && n.timestamp > lastReadNotifTimestamp
    );

    setNotifInfo({
      unread,
      notifications,
      markRead: () => {
        getAccountManager().transform((acc) => {
          return {
            ...acc,
            lastReadNotifTimestamp: now(),
          };
        });
      },
    });
  }, [
    account?.notificationRequestStatuses,
    account?.lastReadNotifTimestamp,
    account?.inviteLinkStatus,
  ]);

  return notifInfo;
}
