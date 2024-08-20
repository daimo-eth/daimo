// English I18N
export const en = {
  lang: "en",

  meta: {
    title: () => "Daimo",
    description: () => "Stablecoin payments app",
  },

  callToAction: {
    justCopiedLink: () => "COPIED, REDIRECTING...",
    copyAndInstall: () => "COPY INVITE & INSTALL DAIMO",
    install: () => "INSTALL DAIMO",
    openInApp: () => "ALREADY HAVE IT? OPEN IN APP",
  },

  misc: {
    faq: () => "FAQ",
    blog: () => "Blog",
  },

  download: {
    downloadDaimo: () => "Download Daimo",
    iphoneOrIpad: () => "IPHONE OR IPAD",
    android: () => "ANDROID",
    orVisit: () => "Or visit",
    onYourPhone: () => "on your phone",
    mac: () => "MAC",
    OR: () => "OR",
    platforms: {
      ios: {
        title: () => "Download on App Store",
      },
      mac: {
        title: () => "Download on Mac App Store",
      },
      android: {
        title: () => "Get it on Google Play",
      },
      other: {
        title: () => "Download on App Store or Google Play",
      },
    },
  },

  link: {
    actions: {
      requesting: () => `is requesting`,
      requestingPayment: () => `is requesting payment`,
      sentYou: () => `sent you`,
      requested: () => `requested`,
      requestedPayment: () => `requested payment`,
      sent: () => `sent`,
      cancelledSend: () => `cancelled send`,
      invitedYou: () => "invited you to Daimo",
      cancelledRequest: () => `cancelled request`,
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

    linkPreview: {
      paidBy: (name: string) => `Paid by ${name}`,
    },

    invitePreview: {
      bonusForPowerUsers: () => "+$10 BONUS FOR POWER USERS",
      joinNameOn: (name: string) => `Join ${name} on`,
    },
  },

  homePage: {
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
      text1: () => "Universal USD, on Ethereum",
      text2: () =>
        "Store money using secure hardware on your phone. Yours alone, like cash.",
      text3: () => "Learn more",
    },
    faq: {
      text1: () => "Frequently asked questions",
      faqs: (): FAQ[] => [
        {
          question: "How do Daimo accounts work?",
          answerHtml:
            "Daimo accounts are Ethereum accounts.\n\n" +
            "Under the hood, they're a new and much-improved type called " +
            "an ERC-4337 contract account. Each device you add to your account " +
            "stores a secret key. When you send money, your phone first authenticates " +
            "you with FaceID or similar, then cryptographically signs the transaction using that key.\n\n" +
            "Daimo is non-custodial. Your keys, your coins.\n\n" +
            "Daimo offers stronger security than traditional wallets. Keys live in dedicated hardware made " +
            "for storing secrets, such as Secure Enclave on iPhone, and never leave your device.\n\n",
        },
        {
          question: "Which stablecoin does Daimo use?",
          answerHtml:
            "Daimo runs on USDC, a high-quality stablecoin issued by Circle\n\n" +
            "Stablecoins are cryptocurrencies designed to maintain a stable " +
            "value. Many are pegged to the dollar, so that one coin is worth " +
            "$1. Circle is a US-based licensed money transmitter partnered " +
            "with Coinbase. USDC is one of the largest and most liquid onchain " +
            'dollar equivalents. <a target="_blank" href="https://bluechip.org/coins/usdc" >Learn more on Bluechip.</a>\n\n',
        },
        {
          question: "Which blockchain does it run on?",
          answerHtml:
            "Daimo uses Base, an Ethereum rollup.\n\n" +
            "Rollups support near-instant transactions that cost " +
            "a few cents each. By contrast, transactions on the underlying " +
            "Ethereum chain (layer 1 or L1) take about 10 times as long and " +
            "cost a few dollars each. Rollups accomplish this by bundling many " +
            "transactions into a single L1 transaction. They inherit the strong " +
            "guarantees of Ethereum: like L1, Base is reliable and secure, and works " +
            'worldwide. <a target="_blank"  href="https://l2beat.com/">Learn more on L2Beat.</a>\n\n',
        },
        {
          question:
            "Can I send other coins like USDT, or use other chains like Polygon?",
          answerHtml:
            "Not yet. We plan to support payments in other stablecoins " +
            "and on other chains soon.\n\n",
        },
        {
          question: "Who can see my Daimo transactions?",
          answerHtml:
            "Currently, all Ethereum transactions are generally public, " +
            "including Daimo transactions. We plan to add private payments " +
            "as the infrastructure and support for them matures.",
        },
        {
          question: "Is Daimo open source?",
          answerHtml:
            "Yes, Daimo is and will always be open-source under GPLv3. We're here to collaborate. " +
            "We want to make self-custody fast, safe, and easy. " +
            '<a target="_blank" href="https://github.com/daimo-eth/daimo">See more on our Github.</a>\n',
        },
      ],
    },
  },
};

export interface FAQ {
  question: string;
  answerHtml: string;
}

export type LangDef = typeof en;
