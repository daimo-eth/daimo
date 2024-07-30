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

  components: {
    downloadLink: {
      download: () => "Download",
    },
    connectWallet: {
      withConnected: () => " WITH CONNECTED WALLET",
      withAnother: () => " WITH ANOTHER WALLET",

      misc: {
        sending: () => "SENDING",
        viewInExplorer: () => "VIEW ON BLOCK EXPLORER",
        wrongNetwork: () => "WRONG NETWORK",
        connectedTo: (network: string) => `CONNECTED TO ${network}`,
        alreadyHaveIt: () => "ALREADY HAVE IT? OPEN IN APP",
      },

      errors: {
        notEnoughFunds: () => "Not enough USDC in wallet",
        alreadyClaimed: () => "Already claimed",
        alreadyFulfilledOrCancelled: () =>
          "Request already fulfilled or cancelled",
        insufficientEth: () => "Insufficient ETH for transaction gas",
        unexpected: (err: any) =>
          `unexpected DaimoLinkStatus ${err} for wallet action`,
      },
    },
    callToAction: {
      alreadyHaveIt: () => "ALREADY HAVE IT? OPEN IN APP",
    },
    linkPreview: {
      paidBy: (name: string) => `Paid by ${name}`,
    },
    invitePreview: {
      bonusForPowerUsers: () => "+$10 BONUS FOR POWER USERS",
      JoinNameOn: (name: string) => `Join ${name} on`,
    },
  },

  app: {
    layout: {
      metadata: {
        description: () => "Stablecoin payments app",
      },
    },
    whyDaimo: {
      features: () => [
        {
          name: "Secure",
          title: "Your keys, your coins.",
          description: [
            "No seed phrase.",
            "Keys live in secure hardware on your phone. Secure passkey backups.",
            "The freedom of self-custody, easier than ever before.",
          ],
          imageUrl: "/assets/why-daimo-secure.png",
        },
        {
          name: "Global",
          title: "Works everywhere.",
          description: [
            "Pay and receive stablecoins globally.",
            "Instant, 24/7 transfers to any of your contacts or any wallet address.",
            "Send a request link, get paid on-chain.",
          ],
          imageUrl: "/assets/why-daimo-global.png",
        },
        {
          name: "Multi-chain",
          title: 'What is "bridging"?',
          description: [
            "Receive any coin on any chain.",
            "Skip slow and expensive bridges.",
            "We're cooking up a really clean way to do this... shipping soon.",
          ],
          comingSoon: true,
          imageUrl: "/assets/why-daimo-multi-chain.png",
        },
      ],
      texts: {
        whyDaimo: () => "Why Daimo?",
        text1: () => "Secure, audited, and fully open source.",
        text2: () => "The safest, fastest way to stablecoin.",
        commingSoon: () => "COMING SOON",
      },
    },
    testimonials: {
      text1: () =>
        "There are these apps that just feel good to use but you can't exactly describe why. Daimo is one of those.",
      text2: () => "Kristof Gazso",
      text3: () => "ERC-4337 coauthor, founder of ",
      text4: () => "Pimlico",
    },
    team: {
      meetTheTeam: () => "Meet the team",
    },
    hero: {
      text1: () => "Your own bank, on Ethereum.",
      text2: () =>
        "Store money using secure hardware on your phone. Yours alone, like cash.",
      text3: () => "Learn more",
    },
    faq: {
      text1: () => "Frequently asked questions",
    },
  },
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 apple"
  return `${n} ${noun}s`; // "0 apples" or "2 apples"
}

export type LanguageDefinition = typeof en;
