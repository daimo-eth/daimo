import { EAccount } from "@daimo/common";

// A special Daimo invite link that shows a Farcaster frame.
export interface InviteFrameLink {
  // URL: https://daimo.com/frame/[id]
  id: number;
  owner: EAccount;

  bonusDollarsInvitee: number;

  auth: {
    ownerMustFollow?: boolean;
    fidMustBeBelow?: number;
    fidWhitelists?: {
      greeting: string;
      fids: number[];
    }[];
  };

  appearance: {
    imgInit: string;
    imgSuccess: string;
    imgFail: string;
    buttonInit: string;
    buttonSuccess: string;
  };
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
    bonusDollarsInvitee: 5,
    auth: {
      fidMustBeBelow: 10000,
    },
    appearance: {
      imgInit: "/assets/frame/daimoo-loading.png",
      imgSuccess: "/assets/frame/daimoo-success.png",
      imgFail: "/assets/frame/daimoo-fail.png",
      buttonInit: "",
      buttonSuccess: "",
    },
  },

  {
    id: 2,
    owner: {
      addr: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      name: "dcposch",
      profilePicture:
        "https://daimo.com/profile/0x4D350d99364634e07B01a9986662787DD3755F0A",
    },
    bonusDollarsInvitee: 13.37,
    auth: {
      fidWhitelists: [
        {
          greeting: "Punk found 🤘",
          fids: [
            3, 43, 56, 81, 90, 94, 108, 132, 143, 172, 222, 294, 389, 785, 1011,
            1124, 1743, 2405, 2416, 2805, 3395, 3429, 3539, 3602, 3871, 3947,
            3973, 4042, 4048, 4262, 4372, 4501, 4816, 4989, 5336, 5486, 5542,
            5548, 5557, 5584, 5614, 5978, 6972, 6991, 7413, 7483, 8048, 8265,
            9280, 9832, 11028, 11031, 12170, 13690, 14161, 14240, 15512, 15516,
            15825, 16713, 16991, 20169, 20583, 20807, 22438, 23357, 189685,
            190045, 190121, 191475, 196166, 211272, 211875, 218648, 231052,
            231371, 238412, 238464, 240224, 240502, 240650, 243451, 243811,
            246170, 247362, 249409, 261305, 268245, 270298, 273100, 274705,
            276945, 277244, 278523, 278655, 279091, 280408, 281900, 282683,
            283056, 285675, 289720, 301694, 302267, 306599, 312785, 321188,
            321630, 326957, 338117, 343171, 354362, 363716,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/daimoo-loading.png",
      imgSuccess: "/assets/frame/daimoo-success.png",
      imgFail: "/assets/frame/daimoo-fail.png",
      buttonInit: "",
      buttonSuccess: "",
    },
  },
];
