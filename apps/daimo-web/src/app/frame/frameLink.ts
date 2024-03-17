import { EAccount } from "@daimo/common";

// A special Daimo invite link that shows a Farcaster frame.
export interface InviteFrameLink {
  // URL: https://daimo.com/frame/[id]
  id: number;
  owner: EAccount;
  allowFidsBelow?: number;
  bonusDollarsInvitee: number;
}

export const inviteFrameLinks: InviteFrameLink[] = [
  {
    id: 1,
    owner: {
      addr: "0x27785Ad361898B526F37d87C4fAcFD757Ff0622F",
      name: "nibnalin",
      profilePicture:
        "https://daimo.com/profile/0x27785Ad361898B526F37d87C4fAcFD757Ff0622F",
    },
    allowFidsBelow: 10000,
    bonusDollarsInvitee: 5,
  },
  {
    id: 2,
    owner: {
      addr: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      name: "dcposch",
      profilePicture:
        "https://daimo.com/profile/0x4D350d99364634e07B01a9986662787DD3755F0A",
    },
    allowFidsBelow: 100,
    bonusDollarsInvitee: 13.37,
  },
];
