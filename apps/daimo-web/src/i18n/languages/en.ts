import { unknown } from "zod";

export const en = {
  download: {
    downloadDaimo: () => "Download Daimo",
    iphoneOrIpad: () => "IPHONE OR IPAD",
    android: () => "ANDROID",
    orVisit: () => "Or visit",
    onYourPhone: () => "on your phone",
    mac: () => "MAC",
  },

  frame: {
    invite: {
      frameMetadata: {
        label: () => `✳️ Get Daimo ✳️`,
      },
      metadata: {
        title: () => `Daimo Invite Frame`,
        description: () =>
          "Fast payments, self custody, open source, one-tap invites.",
        openGraph: {
          title: () => `Daimo Invite Frame`,
          description: () =>
            "Fast payments, self custody, open source, one-tap invites.",
        },
      },
      html: {
        title: () => "✳️ Daimo Invite Frame",
        body: (name: string) =>
          `This is a personalized frame invite from ${name} on Daimo. Post to Farcaster to invite people to join. They'll get a starter $10 USDC.`,
      },
    },

    linkStatus: {
      notDaimoLink: () => "Not a Daimo link: ",
      notFound: () => "Not found: ",
      noFrame: () => "No frame for link: ",
    },

    farcasterClient: {
      wrongFid: () => "Wrong fid",
    },

    FrameLinkService: {
      requests: {
        invalidRequest: () => "Invalid frame request",
        unknownFrame: (pathname: string) => `Unknown frame: ${pathname}`,
      },

      response: {
        bonus: () => "BONUS",
        noBonus: () => "NO BONUS",
        claimInvite: (authMsg: string) => `✳️ Claim Invite · ${authMsg}`,
        notAPowerUser: () => "Not a power user",
        fidToHigh: () => "FID too high",
        notOnList: () => "Not on list",
      },
    },
  },

  l: {
    defaultMetadata: {
      title: () => "Daimo",
      description: () => "Payments on Ethereum",
    },
  },
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 apple"
  return `${n} ${noun}s`; // "0 apples" or "2 apples"
}

export type LanguageDefinition = typeof en;
