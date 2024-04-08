import {
  DaimoInviteCodeStatus,
  DaimoRequestState,
  DaimoRequestV2Status,
  now,
} from "@daimo/common";
import { useEffect, useState } from "react";

import { getAccountManager, useAccount } from "./accountManager";

type InAppNotification = RequestNotification | InvitesNotification;

type BaseNotification = {
  type: "request" | "invite";
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
        (request.status === DaimoRequestState.Created &&
          request.recipient.addr !== account.address) ||
        (request.status === DaimoRequestState.Declined &&
          request.recipient.addr === account.address);

      notifications.push({
        type: "request",
        marksUnread,
        timestamp: request.updatedAt || request.createdAt,
        request,
      });
    }

    // Invites notif, ordered to the top of the list when added or app first loaded.
    if (inviteLinkStatus?.isValid && inviteLinkStatus.createdAt) {
      notifications.push({
        type: "invite",
        marksUnread: true,
        timestamp: inviteLinkStatus.createdAt,
        inviteLinkStatus,
      });
    }

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
