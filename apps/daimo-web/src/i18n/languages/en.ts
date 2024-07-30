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

  link: {
    metadata: {
      title: () => "Daimo",
      description: () => "Payments on Ethereum",
    },

    actions: {
      requesting: () => `is requesting`,
      sentYou: () => `sent you`,
      requested: () => `requested`,
      sent: () => `sent`,
      cancelledSend: () => `cancelled send`,
      invitedYou: () => "invited you to Daimo",
      cancelledRequest: () => `cancelled request`,

      // for convenience
    },

    errors: {
      unrecognizedLink: () => "Unrecognized link",
      loadAccount: () => "Couldn't load account",
      loadStatus: () => "Couldn't load request status",
      loadPayLink: () => "Couldn't load payment link",
    },

    responses: {
      account: {
        desc: () => "Get Daimo to send or receive payments",
      },
      request: {
        desc1: () => "Pay with Daimo",
        desc2: (name: string) => `Paid by ${name}`,
      },
      requestsv2: {
        created: () => "Pay with Daimo",
        canceled: (name: string) => `Cancelled by ${name}`,
        fulfilled: (name: string) => `Paid by ${name}`,
        default: (err: any) => `unexpected DaimoRequestState ${err}`,
      },
      notev2: {
        confirmed: () => "Accept with Daimo",
        claimed: {
          missingReceiver: () => "(missing receiver)",
          desc: (claim: string) => `Accepted by ${claim}`,
        },
        cancelled: (name: string) => `Cancelled by ${name}`,
        default: (status: any) => `unexpected DaimoNoteStatus ${status}`,
      },
      invite: {
        expired: () => "Invite expired",
        acceptTheInviteBoth: (bonusDollarsInvitee: any) =>
          `Accept their invite and we'll send you both $${bonusDollarsInvitee} USDC`,
        acceptTheInvite: (bonusDollarsInvitee: any) =>
          `Accept their invite and we'll send you $${bonusDollarsInvitee} USDC`,
        getDaimo: () => "Get Daimo to send or receive payments",
      },
    },
  },

  pos: {
    title: () => "Daimo Point-Of-Sale",
    description: () => "One-tap USDC checkout.",
  },

  profile: {
    errorNoImage: () => "No image found",
  },

  waitlist: {
    signUp: () => "Sign up for Daimo",
    name: () => "Name",
    email: () => "Email",
    social: () => "Social (Twiter, Warpcat, etc)",
    submit: () => "SUBMIT",
    submitting: () => "SUBMITTING",
    submitted: () => `Submitted! We'll reach out on email soon.`,
    isLimited: () =>
      "Daimo is currently in limited release. Sign up for early access",
  },

  utils: {
    metaTags: {
      checkStatus: () => "Check Status",
      buttons: {
        openInDaimo: () => "Open in Daimo",
        payRequest: () => "Pay Request",
      },
    },
    linkStatus: {
      // some of these are duplicated in this.link so those we reused
      unhandeledLink: (linkType: any) => `Unhandled link type: ${linkType}`,
      unhandeledLinkForType: (linkType: any) =>
        `Unhandled link status for type: ${linkType}`,
    },

    platform: {
      ios: () => "Download on App Store",
      mac: () => "Download on Mac App Store",
      android: () => "Get it on Google Play",
      other: () => "Download on App Store or Google Play",
    },
  },
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 apple"
  return `${n} ${noun}s`; // "0 apples" or "2 apples"
}

export type LanguageDefinition = typeof en;
