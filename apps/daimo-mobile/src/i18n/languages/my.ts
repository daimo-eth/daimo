import { LanguageDefinition } from "./en";

export const my: LanguageDefinition = {
  // Common text components
  shared: {
    buttonStatus: {
      success: () => `ပေးပို့မှုအောင်မြင်သည်`,
      error: () => `မှားယွင်းနေပါသည်`,
      retry: () => `ထပ်မံပြုလုပ်မည်`,
      sent: () => `ပေးပို့ပြီးပါပြီ`,
      request: () => `တောင်းခံမည်`,
    },
    buttonAction: {
      confirm: () => `အတည်ပြုမည်`,
      cancel: () => `ပယ်ဖျက်မည်`,
      decline: () => `ငြင်းပယ်မည်`,
      request: () => `တောင်းခံမည်`,
      send: () => `ပေးပို့မည်`,
      accept: () => `လက်ခံမည်`,
      submit: () => `Submit`,
      continue: () => `ဆက်လက်ဆောင်ရွက်မည်`,
    },
    textPressable: {
      cancel: () => `ပယ်ဖျက်မည်`,
    },
  },
  // useSendAsync for sending userops
  sendUserOp: {
    loadingAccount: () => `Loading account...`,
    authorizing: () => `Authorizing...`,
    accepted: () => `လက်ခံလိုက်ပါပြီ`,
    offline: () => `လုပ်ငန်စဥ်မအောင်မြင်ပါ။ အင်တာနက်လိုင်းကျနေပါသလား?`,
    error: () => `ပေးပို့ရာတွင်တစ်စုံတစ်ခုအမှားအယွင်းရှိနေပါသည်`,
  },
  // -------------------------- SCREENS --------------------------
  // ------------ HISTORY ------------
  // HistoryList.tsx
  historyList: {
    empty: () => `ပေးပို့ထားမှုများမရှိပါ`,
    screenHeader: {
      default: () => `ပေးပို့ထားသောမှတ်တမ်းများ`,
      other: () => `Between you`,
    },
    op: {
      cancelledLink: () => `Linkကိုပယ်ဖျက်မည်`,
      pending: () => `ဆောင်ရွက်နေပါသည်`,
    },
  },
  // HistoryOpScreen.tsx
  historyOp: {
    shareLinkAgain: () => `Linkကိုထပ်မံမျှဝေမည်`,
    viewReceipt: () => `ပေးပို့မှုမှတ်တမ်းကိုကြည့်ရှုမည်`,
    opVerb: {
      createdLink: () => `Created link`,
      acceptedLink: () => `Accepted link`,
      receivedRequest: () => `Received request`,
      fulfilledRequest: () => `Fulfilled request`,
      cancelledLink: () => `Cancelled link`,
      sent: () => `ပေးပို့ပြီးပါပြီ`,
      received: () => `လက်ခံရရှိသည်`,
      deposited: () => `Deposited`,
      depositing: () => `Depositing`,
      withdrew: () => `Withdrew`,
      withdrawing: () => `Withdrawing`,
    },
    help: {
      title: () => `ပေးပို့မှုနှင့်ပတ်သက်သောအချက်အလက်များ`,
      whyNoFees: {
        firstPara: (chainName: string) =>
          `ယခုပေးပို့မှုကို Ethereum rollup ဖြစ်သော ${chainName} ပေါ်တွင်ဆောင်ရွက်ပါမည်`,
        firstPara2Chain: (chainA: string, chainB: string) =>
          `ယခုပေးပို့မှုသည် ${chainA} နှင့်${chainB} တို့ပေါ်တွင်ဆောင်ရွက်သွားမည်ဖြစ်ပါသည်`,
        secondPara: () =>
          `Rollups inherit the strong security guarantees of Ethereum, at lower cost.`,
        thirdPara: () =>
          `ပေးပို့မှုအတွက်ငွေကြေးအနည်းငယ်ကုန်ကျမည်ဖြစ်သော်လည်း Daimo မှပေးပို့ခကိုစိုက်ထုတ်ပေးသွားမည်ဖြစ်ပါသည်။`,
      },
      landlineDepositProcessing: {
        firstPara: () =>
          "This transaction transfers funds from your connected bank account to your Daimo account.",
        secondPara: () =>
          "Once the funds are received by our partner, we will make an on-chain transfer to deposit the funds to your Daimo account.",
        thirdPara: () =>
          "Bank transfers normally cost a few dollars. Daimo sponsored this transfer, making it free.",
      },
      landlineDepositCompleted: {
        firstPara: () =>
          "This transaction transferred funds from your connected bank account to your Daimo account.",
        secondPara: () =>
          "Bank transfers normally cost a few dollars. Daimo sponsored this transfer, making it free.",
      },
      landlineWithdrawalProcessing: {
        firstPara: () =>
          "This transaction transfers funds from your Daimo account to your connected bank account.",
        secondPara: () =>
          "The funds are transferred on-chain to our partner's address. Upon receiving the funds, we initiate a bank transfer to your bank account.",
        thirdPara: () =>
          "Bank transfers normally cost a few dollars. Daimo sponsored this transfer, making it free.",
      },
      landlineWithdrawalCompleted: {
        firstPara: () =>
          "This transaction transferred funds from your Daimo account to your connected bank account.",
        secondPara: () =>
          "Bank transfers normally cost a few dollars. Daimo sponsored this transfer, making it free.",
      },
    },
    feeText: {
      free: () => `FREE`,
      pending: () => `PENDING`,
      fee: (amount: string) => `${amount} FEE`,
    },
    fundArrivalTime: {
      deposit: () => `Your funds will arrive to your Daimo account`,
      withdrawal: () => `Your funds will arrive to your bank account`,
    },
  },

  // ------------ KEYROTATION ------------
  // AddDeviceScreen.tsx
  addDevice: {
    screenHeader: () => `Device အသစ်များနှင့်ချိတ်ဆက်မည်`,
    headerDescription: () =>
      `ယခု QR ကုဒ်ကို scan ဖတ်၍ သင်၏ယခုအကောင့်ကို အခြား Device အသစ်များနှင့်ချိတ်ဆက်အသုံးပြုပါ။`,
    scanQR: {
      error: () => `QR ကုဒ်မှားယွင်းနေပါသည်`,
      scanned: (slot: string) => `Scan ဖတ်ပြီးပါပြီ ${slot}`,
      add: (slot: string) => `ထည့်သွင်းမည် ${slot}`,
    },
  },
  // AddKeySlotButton.tsx
  addKeySlot: {
    userCancelled: () => `ပယ်ဖျက်မည်`,
  },
  // DeviceScreen.tsx
  device: {
    deleted: () => `ပယ်ဖျက်ထားသော Device များ`,
    confirmation: {
      titleRemoveDevice: (deviceName: string) => `ပယ်ဖျက် ${deviceName}\n`,
      msgRemoveDevice: () => `ယခု Device ကို ပယ်ဖျက်ပါမည်လား`,
      titleDeleteAccount: () => `Delete Account`,
      msgDeleteAccount: () => `Are you sure you want to delete your account?`,
      remove: () => `Remove`,
      cancel: () => `Cancel`,
    },
    current: {
      cannotRemove: () =>
        `ယခုအကောင့်သည်အခြားသော Device များနှင့်ချိတ်ဆက်ထားခြင်းမရှိသေးပါ။ ထို့ကြောင့် ဆုံးရှုံးမှုမဖြစ်ပွားစေရန် မပယ်ဖျက်မီလက်ကျန်ငွေကို ပြောင်းရွှေ့ထားရန်အကြံပြုပါသည်။ `,
      usingTitle: () => `You're using this device now`,
      deleteTitle: () => `Delete your account`,
      usingSubtitle: () =>
        `ယခုလုပ်ငန်းစဥ်ကိုဆောင်ရွက်မည်ဆိုပါက အကောင့်မှထွက်သွားမည်ဖြစ်ပါသည်`,
      deleteSubtitle: () =>
        `This is your only device. Removing it will delete your account.`,
    },
  },

  // ------------ LINK ------------
  // NoteScreen.tsx
  note: {
    payment: () => `ပေးချေရန် Link`,
    accept: {
      title: () => `လက်ခံမည်`,
      link: () => `Linkကိုလက်ခံမည်`,
      long: (dollars: string) => `ယခုLinkမှတဆင့် ${dollars} ကိုလက်ခံမည်`,
      loading: () => `ဆောင်ရွက်နေပါသည်`,
    },
    accepted: {
      title: () => `လက်ခံပြီးပါပြီ`,
      link: () => `လက်ခံရရှိခဲ့သောLinkများ`,
      long: (name: string) => `${name} မှလက်ခံရရှိပြီးပါပြီ`,
    },
    cancel: {
      title: () => `ပယ်ဖျက်မည်`,
      link: () => `Linkကိုပယ်ဖျက်မည်`,
      long: (dollars: string) =>
        `${dollars} ကိုပြန်လည်ရယူရန် ယခုLinkကိုဖျက်သိမ်းမည်`,
    },
    cancelled: {
      title: () => `ပယ်ဖျက်ပြီးပါပြီ`,
      link: () => `ပယ်ဖျက်ခဲ့သောလင့်များ`,
      longSelf: () => `သင်သည်ယခုပေးချေသည့် Link ကို ပယ်ဖျက်ထားပါသည်`,
      longOther: () => `ပေးပို့သူမှပယ်ဖျက်သွားပါသည်`,
    },
    pending: {
      long: () => `ပေးချေရန် Link ကိုရှာမတွေ့ပါ။ `,
    },
    gasTooHigh: () => `Gas too high to claim`,
    invalid: () => `ပေးချေရန် Link မှားယွင်းနေပါသည်`,
    send: {
      self: () => `သင်မှပေးပို့ထားပါသည်`,
      other: (name: string) => `${name} မှပေးပို့ထားပါသည်`,
    },
  },

  // ------------ NOTIFICATIONS ------------
  // InvitesNotificationRow.tsx
  invitesNotification: {
    description: (inviteCount: number) =>
      `You have ${pluralize(inviteCount, "invite")} available.`,
  },
  // NotificationsScreen.tsx
  notifications: {
    screenHeader: () => `အသိပေးချက်`,
    noNotifications: () => `အသိပေးချက်အသစ်များမရှိပါ`,
  },
  // RequestNotificationRow.tsx
  requestNotification: {
    msgVerb: {
      via: () => `မှတဆင့်`,
      from: () => `မှ`,
      for: () => `ဆီသို့`,
    },
    requestState: {
      created: {
        self: () => `သင်မှတောင်းခံခဲ့ပါသည် `,
        other: () => `တောင်းခံခဲ့ပါသည်`,
      },
      request: () => `တောင်းခံမှု`,
      fulfilled: {
        self: () => `fulfilled your`,
        other: () => `၏တောင်းခံမှုကို သင်မှဖြည့်ဆည်းပေးခဲ့ပါသည် `,
      },
      cancelled: {
        self: () => `သင်၏....ကိုသင်ပယ်ဖျက်ခဲ့ပါသည်`,
        other: () => `သူတို့၏တောင်းခံမှုကိုပယ်ဖျက်ပါမည်`,
      },
      declined: {
        self: () => `သင်၏တောင်းခံမှုကိုငြင်းပယ်ခဲ့ပါသည်`,
        other: () => `၏တောင်းခံမှုကိုသင်ငြင်းပယ်ခဲ့ပါသည်`,
      },
    },
  },
  // SwapNotificationRow.tsx
  swapNotification: {
    msg: (readableAmount: string, coinName: string) =>
      `Accept ${readableAmount} ${coinName} from `,
  },

  // ------------ ONBOARDING ------------
  // AllowNotifsScreen.tsx
  allowNotifs: {
    screenHeader: () => `အသိပေးချက်များ`,
    allowButton: () => `အသိပေးချက်ကိုခွင့်ပြုမည်`,
    skipButton: () => `ရှေ့ဆက်သွားမည်`,
    instructions: () =>
      `သင့်အကောင့်၏ ငွေပေးချေမှုများကိုသာ အသိပေးမည်။You will only be notified about activity on your account.`,
  },
  // settings.ts
  settingsModal: {
    modalTitle: () => `Enable access in Settings`,
    modalBody: ({ settingPhrase }: { settingPhrase: string }) =>
      `Visit Settings » Daimo and enable ${settingPhrase}.`,
    settingPhrase: {
      contacts: () => `ဆက်သွယ်ရန်`,
      notifications: () => `အသိပေးချက်`,
      camera: () => `ကင်မရာအသုံးပြုခွင့်`,
    },
  },
  // ExistingChooseAccountScreen.tsx
  existingChooseAccount: {
    screenHeader: () => `Load account`,
    selectAccount: {
      placeholder: () => `username ထည့်သွင်းပါ`,
      description: () => `မည်သည့်အကောင့်သို့ဝင်ရောက်မည်ကိုရွေးချယ်ပါ`,
    },
    searchResults: {
      empty: () => `မရှိပါ`,
    },
  },
  // ExistingScreen.tsx
  existing: {
    screenHeader: () => `အသုံးပြုနေသောအကောင့်များ`,
    generatingKeys: () => `Generating keys...`,
    scanQR: () =>
      `ယခုDaimo အကောင့်အား တခြားစက်တွင်ထည့်သွင်းရန် ဤ QR Code ကို Scan ဖတ်ပါ။`,
    useBackup: () => `Backup ကိုအသုံးပြုမည်`,
  },
  // ExistingSeedPhraseScreen.tsx
  existingSeedPhrase: {
    screenHeader: () => `seed phrase အသုံးပြု၍အကောင့်ကိုဝင်ရောက်မည်`,
  },
  // ExistingUseBackupScreen.tsx
  existingUseBackup: {
    screenHeader: () => `အကောင့်ပြန်လည်ရယူရန်နည်းလမ်းကိုရွေးချယ်ပါ`,
    description: () =>
      `Log in with a backup key.\nThis adds your device to the account.`,
    logInWithSeedPhrase: () => `SEED PHRASE ဖြင့်အကောင့်ကိုဝင်ရောက်မည်`,
  },
  // LogInButton.tsx
  logIn: {
    logIn: () => `ဝင်မည်`,
    logInWith: ({ keyType }: { keyType: string }) =>
      `${keyType} ဖြင့် အကောင့်သို့ဝင်မည်`,
    type: {
      securityKey: () => `SECURITY KEY`,
      passkey: () => `PASSKEY`,
    },
    fromSeed: {
      error: () => `ဤအကောင့်တွင် Seed Phrase မရှိပါ။ ပယ်ဖျက်ထားပါသလား ? `,
      button: () => `SEED PHRASE ဖြင့်အကောင့်သို့ဝင်ရောက်မည်`,
    },
  },
  // MissingKeyScreen.tsx
  missingKey: {
    screenHeader: () => `Keyမှားယွင်းနေပါသည်`,
    logOut: () => `ထွက်မည်`,
    keyErrorDesc: {
      noKey: {
        title: () => `New phone?`,
        desc: () =>
          `We found your account, but no device key. Keys in secure hardware never leave your device, so they don't transfer when you get a new phone. Log out, then log in using a backup key.`,
      },
      removedKey: {
        title: () => `ချိတ်ဆက်ထားသောစက်ကို ပယ်ဖျက်မည်`,
        desc: () =>
          `It looks like the key on this device was removed from your account. Log out, then log in using a backup key.`,
      },
      unhandledKeyError: {
        title: () => `Unhandled key error`,
        desc: () => ``,
      },
    },
  },
  // OnboardingChooseNameScreen.tsx
  onboardingChooseName: {
    screenHeader: () => `Username ရွေးချယ်ပါ`,
    instructions: () =>
      `Daimo တွင်အသုံးပြုမည့် username ကိုရွေးချယ်ပါ။ ထို username သည် public မှမြင်ရပါလိမ့်မည်။`,
    picker: {
      title: () => `usernameကိုရွေးချယ်ပါ`,
      createButton: () => `အကောင့်ပြုလုပ်မည် `,
      generateRandom: () => `RANDOM ပြုလုပ်မည်`,
      error: () => `အင်တာနက်ပြတ်တောက်နေပါသည်`,
      taken: () => `ယခုနာမည်အားသုံးစွဲသူရှိနှင့်ပြီးဖြစ်ပါသည်`,
      available: () => `အသုံးပြုနိုင်ပါသည်`,
    },
  },
  // OnboardingEnterInviteScreen.tsx
  onboardingEnterInvite: {
    screenHeader: () => `Invite Code ကိုထည့်သွင်းပါ`,
    waitlistButton: () => `JOIN WAITLIST`,
    instructions: () =>
      `Invite ကုတ် (သို့မဟုတ်) Link ကိုထည့်သွင်းပါ။ မရှိပါက waitlist တွင်စာရင်းသွင်း၍ စောင့်ဆိုင်းနိုင်ပါသည်။`,
    inviteCode: {
      title: () => `invite code ကိုထည့်သွင်းမည်`,
      button: () => `အတည်ပြုမည်`,
    },
  },
  // OnboardingIntroScreen.tsx
  onboardingIntro: {
    title: () => `Welcome to Daimo`,
    subtitle: () => `Pay or receive USDC anywhere`,
    acceptInviteButton: () => `ဖိတ်ခေါ်မှုကိုလက်ခံမည်`,
    alreadyHaveAccountButton: () => `အကောင့်ရှိပြီးသားဖြစ်ပါသလား `,
    rows: {
      selfCustody: {
        title: () => `Your keys, your coins`,
        description: () => `USDC on Base.`,
      },
      help: {
        button: () => `ဆက်လက်လေ့လာရန်`,
        description: () => `USDC ဆိုတာဘာလဲ?`,
      },
      everywhere: {
        title: () => `Works everywhere`,
        description: () => `Instant, 24/7 transfers to any contact`,
      },
      onEthereum: {
        title: () => `Runs on Ethereum`,
        description: () => `Daimo runs on Base, a rollup`,
      },
    },
    helpModalUSDC: {
      description: () =>
        `USDC သည် US ဒေါ်လာနှင့် ထပ်တူညီစွာ 1:1 အသုံးပြုနိုင်ရန်ထိန်းညှိထားသည့် ဒစ်ဂျစ်တယ်ငွေကြေးဖြစ်ပါသည်။`,
      learnMore: () => `USDC အကြောင်းဆက်လက်လေ့လာရန်`,
      here: () => `here`,
    },
  },
  // OnboardingSetupKeyPage.tsx
  onboardingSetupKey: {
    screenHeader: () => `Set up device`,
    pin: {
      generateDescription: () =>
        `Generate your Daimo device key. This key is generated and stored on your device, and secures access to your Daimo account.`,
      failedDescription: () =>
        `Authentication failed. Does your phone have a secure lock screen set up? You'll need one to secure your Daimo account.`,
      tryAgainButton: () => `Try again`,
      generateButton: () => `Generate`,
    },
  },

  // ------------ RECEIVE ------------
  // ReceiveNavScreen.tsx
  receiveNav: {
    screenHeader: () => `Request`,
  },
  // ReceiveScreen.tsx
  receive: {
    screenHeader: () => `Request from`,
    sendRequest: {
      loading: () => `Requesting...`,
      title: () => `Send a request link`,
      subtitle: () => `မက်ဆေ့ပို့သည့် appများ မှတဆင့် USDC ကိုတောင်းခံမည် `,
    },
  },

  // ------------ SEND ------------
  // FulfillRequestButton.tsx
  fulfillRequest: {
    disabledReason: {
      fulfilled: () => `တောင်းခံမှုကို ပေးချေပြီးဖြစ်သည်`,
      cancelled: () => `တောင်းခံမှုကို ပယ်ဖျက်မည်`,
      self: () => `ကိုယ့်အကောင့်ကို ပြန်ပို့၍မရပါ။`,
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ `,
    },
    holdButton: () => `HOLD TO FULFILL`,
    statusMsg: {
      paymentsPublic: () => `Payments are public`,
      totalDollars: (dollars: string) => `Total incl. fees ${dollars}`,
    },
  },
  // MemoDisplay.tsx
  memoDisplay: {
    status: (status: string) => `မှတ်ချက်ရေးရန် ${status}`,
    placeholder: () => `WHAT FOR?`,
  },
  // NoteAction.tsx
  noteAction: {
    disabledReason: {
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
    },
    statusMsg: {
      totalDollars: (dollars: string) => `Total incl. fees ${dollars}`,
    },
    externalAction: {
      sms: () => `မက်ဆေ့ပို့ရန်`,
      email: () => `အီးမေးလ်ပို့ရန်`,
      paymentLink: () => `ငွေပေးချေရန်လင့်ကိုပေးပို့မည် `,
    },
    holdButton: () => `အတည်ပြုရန်နှိပ်ထားပါ`,
  },
  // RouteDisplay.tsx
  routeDisplay: {
    theyWillReceive: (amount: string, tokenSymbol: string, chainName: string) =>
      `They will receive ${amount} ${tokenSymbol} on ${chainName}`,
  },
  // SendNavScreen.tsx
  sendNav: {
    screenHeader: () => `Send`,
  },
  // SendNoteScreen.tsx
  sendNote: {
    screenHeader: () => `Send Link`,
    info: ({ tokenSymbol }: { tokenSymbol: string }) =>
      `Send ${tokenSymbol} via link`,
    help: {
      title: () => `How Payment Links Work`,
      learn: () => `Learn how`,
      subtitle: () => `anyone with the link can claim`,
      description: {
        firstPara: () =>
          `Payment links carry money in a link, so that you can send it to anyone.`,
        secondPara: () =>
          `You can cancel an unclaimed link to get your money back.`,
        thirdPara: () => `They're self-custody. The key is part of the URL.`,
        fourthPara: () =>
          `Each link doubles as a Daimo invite. Plus, anyone with the link can claim with any wallet, like Rainbow or Metamask.`,
      },
    },
    enterAmount: () => `ပမာဏအားထည့်သွင်းပါ`,
    createLinkButton: () => `ပေးချေရန်လင့်ကိုပြုလုပ်ပါ`,
  },
  // SendTransferButton.tsx
  sendTransferButton: {
    disabledReason: {
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
      self: () => `ကိုယ့်ကိုကိုယ်ပြန်ပို့၍မရပါ`,
      other: () => `ထိုအကောင့်သို့ပေးပို့၍မရပါ`,
      zero: () => `ပမာဏအားထည့်သွင်းပါ`,
      min: (minTransferAmount: number) =>
        `အနည်းဆုံးပေးပို့ရမည့်ပမာဏမှာ ${minTransferAmount} USDC ဖြစ်သည်`,
    },
    holdButton: () => `ပေးပို့ရန်နှိပ်ထားပါ`,
    statusMsg: {
      insufficientFundsPlusFee: (totalStr: string) =>
        `ပေးပို့ရန်သင့်တွင် အနည်းဆုံး ${totalStr} ရှိရန်လိုအပ်ပါသည်`,
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
      totalDollars: (totalStr: string) => `Total with fees ${totalStr}`,
      paymentsPublic: () => `Payments are public`,
    },
  },
  // SendTransferScreen.tsx
  sendTransferScreen: {
    screenHeader: () => `Send to`,
    firstTime: (name: string) => `First time paying ${name}`,
    memo: () => `မှတ်စု`,
    sendAs: () => `Send as`,
  },
  contactDisplay: {
    requestedBy: () => `မှတောင်းခံသည်`,
  },
  // LandlineDepositButton.tsx
  landlineDepositButton: {
    holdButton: () => "ငွေဖြည့်ရန်နှိပ်ထားပါ",
    depositStatus: {
      creating: () => "ငွေဖြည့်နေပါသည်",
      success: () => "ငွေဖြည့်သွင်းမှုအောင်မြင်ပါသည်",
      failed: () => "ငွေဖြည့်သွင်းမှုမအောင်မြင်ပါ",
    },
  },
  // ------------ MISC SCREENS ------------
  // DepositScreen.tsx
  deposit: {
    screenHeader: () => `ငွေဖြည့်သွင်းရန် (သို့) ငွေထုတ်ရန် `,
    go: () => `နောက်သို့`,
    continue: () => `နောက်သို့`,
    landline: {
      cta: () => `Connect with Landline`,
      title: () => `Deposit or withdraw directly from a US bank account`,
      optionRowTitle: (timeAgo: string) => `Connected ${timeAgo} ago`,
      startTransfer: () => `Start transfer`,
    },
    binance: {
      cta: () => `Binance မှတဆင့်ငွေဖြည့်ရန်`,
      title: () => `Binance အကောင့်မှပေးပို့မည်`,
    },
    default: {
      cta: () => `ငွေဖြည့်ရမည့် Address`,
      title: () => `Send to your address`,
    },
    loading: () => `loading...`,
    initiated: {
      title: () => `ငွေဖြည့်သွင်းမှုစတင်ဆောင်နေပါသည်`,
      subtitle: () =>
        `Complete in browser, then funds should arrive in a few minutes.`,
    },
    withdraw: {
      cta: () => `ထုတ်ယူမည်`,
      title: () => `တခြား ဝေါလက်(သို့မဟုတ်) Exchange သို့ ပြောင်းရွှေ့မည်`,
    },
    bitrefill: {
      cta: () => `Withdraw with Bitrefill`,
      title: () => `Buy gift cards with USDC`,
      success: () => `success, waiting for confirmation`,
    },
  },
  // errorScreens.tsx
  error: {
    banner: () => `တစ်စုံတစ်ခုမှားယွင်းနေပါသည်`,
  },
  // HomeScreen.tsx
  home: {
    pending: (pendingDollars: string) => `+ $${pendingDollars} PENDING`,
    finishAccountSetUp: () => `Finish setting up your account`,
    yourBalance: () => `သင်၏လက်ကျန်ငွေ`,
    deposit: () => `ငွေဖြည့်သွင်းမည်`,
    request: () => `တောင်းဆိုမည်`,
    send: () => `ပေးပို့မည်`,
  },
  // InviteScreen.tsx
  invite: {
    screenHeader: () => `သူငယ်ချင်းများကိုဖိတ်ခေါ်မည်`,
    more: (moreInvitees: number) => `+${moreInvitees} more`,
    invited: (invited: number) =>
      `You've invited ${pluralize(invited, "friend")}`,
    left: (usesLeft: number) =>
      `${usesLeft} ${pluralize(usesLeft, "invite")} left`,
    locked: {
      header: () => `Invite your friends and earn USDC!`,
      description: () =>
        `Use Daimo more to unlock invites. Send a payment link to onboard your contacts.`,
    },
    sendButton: () => `SEND`,
    referral: {
      creditForInvite: (bonusSubtitle: string) =>
        `You'll get credit for the invite on their profile ${bonusSubtitle}`,
      bonusBoth: (bonusDollarsInvitee: number) =>
        `and we'll send you both $${bonusDollarsInvitee} USDC`,
      bonusInvitee: (bonusDollarsInvitee: number) =>
        `and we'll send them $${bonusDollarsInvitee} USDC`,
      bonusInviter: (bonusDollarsInviter: number) =>
        `and we'll send you $${bonusDollarsInviter} USDC`,
      inviteCode: () => `Invite Code`,
      inviteLink: () => `Invite Link`,
      share: {
        button: () => `Share Link`,
        farcasterButton: () => `SHARE FRAME ON FARCASTER`,
        farcasterMsg: () => `Join+me+on+Daimo`,
      },
    },
  },
  // LandlineBankTransfer.tsx
  landlineBankTransfer: {
    title: {
      deposit: () => `Deposit from`,
      withdraw: () => `Withdraw to`,
    },
    warning: {
      titleDeposit: () => `Deposits are public`,
      titleWithdraw: () => `Withdrawals are public`,
      minimumDeposit: () => `Minimum deposit of 1 USD`,
      minimumWithdraw: () => `Minimum withdrawal of 1 USDC`,
    },
    depositStatus: {
      shouldFastFinish: () => `Funds will arrive instantly.`,
      txLimit: () =>
        `This deposit exceeds maximum instant deposit limit ($1000). Funds arrive in 1-3 business days.`,
      monthlyLimit: () =>
        `This deposit will exceed your monthly instant deposit limit ($5000/mo). Funds arrive in 1-3 business days.`,
      maxDeposit: () => `Max deposit`,
    },
    withdrawStatus: {
      standard: () => `Funds arrive within 3 business days.`,
      maxWithdrawal: () => `Max withdrawal`,
    },
  },
  // ProfileScreen.tsx
  profile: {
    screenHeader: () => `Profile`,
    error: {
      account: {
        title: () => `Account not found`,
        msg: (account: string) => `Couldn't load account ${account}`,
      },
      invite: {
        title: () => `Invite not found`,
        msg: (code: string) => `Couldn't load invite ${code}`,
      },
    },
    subtitle: {
      invitedBy: () => `Invited by `,
      joined: (timeAgo: string) => `Joined ${timeAgo}`,
    },
  },
  // QRScreen.tsx
  qr: {
    title: {
      display: () => `Display QR Code`,
      scan: () => `Scan QR Code`,
    },
    slider: {
      payMe: () => "PAY ME",
      scan: () => "SCAN",
    },
    copiedAddress: () => `Copied address`,
    depositButton: () => `DEPOSIT FROM EXCHANGE ›`,
  },
  // SeedPhraseScreen.tsx
  seedPhrase: {
    title: {
      copy: () => `Copy seed phrase`,
      verify: () => `Verify seed phrase`,
    },
    description: () =>
      `This seed phrase will be added to your account, allowing you to recover it even if you lose your device.`,
    button: {
      continue: () => `Continue`,
      finish: () => `Finish Setup`,
    },
    copy: {
      confirm: () => `I've saved this seed phrase securely`,
      clipboard: () => `COPY TO CLIPBOARD`,
    },
    verify: {
      description: () => `Type your seed phrase into the input box.`,
    },
  },
  // SettingsScreen.tsx
  settings: {
    screenHeader: () => `Settings`,
    showDetails: () => `Show details`,
    hideDetails: () => `Hide details`,
    account: {
      connectFarcaster: () => `CONNECT FARCASTER`,
      viewAccountOnExplorer: () => `VIEW ACCOUNT ON EXPLORER`,
      noSocialsConnected: () => `NO SOCIALS CONNECTED`,
    },
    devices: {
      title: () => `My devices & backups`,
      thisDevice: () => `THIS DEVICE`,
      passkeys: {
        title: () => `What is a passkey backup?`,
        description: {
          firstPara: () =>
            `Passkeys are a convenient and phishing-resistant alternative to seed phrases`,
          secondPara: () =>
            `Passkeys are generated and stored in your password manager, and allow you to recover your account even if you lose your device.`,
        },
      },
      createBackup: {
        title: () => `Backup ပြုလုပ်မည်`,
        msg: () => `Passkey, security key, or seed phrase`,
        button: () => `Backup ပြုလုပ်မည်`,
      },
      addDevice: {
        title: () => `Add a Device`,
        msg: () =>
          `မိမိအကောင့်ကို နောက်ထပ်စက်တစ်လုံးတွင်အသုံးပြုမည်Use your account on another device`,
        button: () => `DEVICE ထည့်သွင်းရန်`,
      },
      contactSupport: {
        title: () => `မေးခွန်းမေးရန် (သို့) အကြံပြုရန်?`,
        msg: () => `Telegram တွင်ဆက်သွယ်ရန်`,
        button: () => `အကူအညီတောင်းရန်`,
      },
    },
    logOut: () => `Log out`,
    delete: () => `Delete account`,
    remove: () => `ဖျက်မည်`,
    pending: () => `Pending`,
    addedAgo: (timeAgo: string) => `${timeAgo} တွင်ထည့်သွင်းခဲ့သည်`,
    details: {
      title: () => `Device အသေးစိတ်အချက်လက်များ`,
      enableNotifications: () => `Enable notifications`,
      sendDebugLog: () => `Send debug log`,
    },
  },
  // YourInvitesScreen.tsx
  yourInvites: {
    screenHeader: () => `မိမိဖိတ်ခေါ်ထားသူများ`,
    joinedAgo: (timeAgo: string) => `${timeAgo} တွင်ဝင်ရောက်ခဲ့သည်`,
  },

  // -------------------------- SHARED --------------------------
  // AmountInput.tsx
  amountInput: {
    dollarsAvailable: (dollars: string) => `လက်ကျန် ${dollars} `,
  },
  // OfflineHeader.tsx
  offlineHeader: {
    header: () => `Offline`,
    retrying: () => `Retrying...`,
  },
  // Scanner.tsx
  scanner: {
    enableCamera: () => `ကင်မရာအသုံးပြုခွင့်ပေးမည်`,
  },
  // SearchHeader.tsx
  searchHeader: {
    searchUser: () => `နာမည်ဖြင့်ရှာမည်`,
  },
  // SearchResults.tsx
  searchResults: {
    noResults: () => `No results`,
    paymentLinkButton: () => `SEND PAYMENT LINK INSTEAD`,
    sentAgo: (timeAgo: string) => `${timeAgo} တွင်ပေးပို့ခဲ့သည်`,
    receivedAgo: (timeAgo: string) => `${timeAgo} တွင် လက်ခံရရှိခဲ့သည်`,
    extra: {
      contact: () => `Send to contact`,
      requestLink: () => `Request via link`,
      sendLink: () => `Send via link`,
      showQR: () => `Show QR code`,
      scanQR: () => `Scan QR code`,
    },
  },
  // SearchScreen.tsx
  searchScreen: {
    placeholderWithContact: () => `Search user, ENS, contact, or email...`,
    placeholderWithoutContact: () => `Search user, ENS, email, or phone...`,
    cancel: () => `Cancel`,
  },

  // -------------------------- SHEET --------------------------
  // CreateBackupSheet.tsx
  createBackup: {
    default: {
      header: () => `Backup ပြုလုပ်မည်`,
      passkeyTitle: () => `Passkey backup ပြုလုပ်မည်`,
      passkeyBullet1: () => `Convenient, secure, and resistant to phishing`,
      passkeyBullet2: () =>
        `Stored by your password manager, like iCloud Keychain or 1Password`,
      offlineInsteadButton: () => `Back up offline instead`,
    },
    offline: {
      header: () => `Offline backup ပြုလုပ်မည်`,
      securityKeyTitle: () => `Security key backup ပြုလုပ်မည်`,
      securityKeyBullet1: () => `Use a physical FIDO key, such as a YubiKey`,
      seedPhraseTitle: () => `seed phrase ပြုလုပ်မည်`,
      seedPhraseBullet1: () =>
        `Your funds are connected to a phrase you can store securely`,
      seedPhraseButton: () => `Seed phrase ဖြင့် Backup ပြုလုပ်မည်`,
    },
    addKey: {
      passkey: () => `PASSKEY`,
      securityKey: () => `SECURITY KEY`,
      button: (slotType: string) => `BACK UP WITH ${slotType}`,
    },
    recommended: {
      compact: () => `REC.`,
      default: () => `RECOMMENDED`,
    },
  },
  // DebugBottomSheet.tsx
  debugBottom: {
    sheetHeader: () => `Did something go wrong?`,
    description: () =>
      `Contact us on Telegram, then tap Send Debug Log to send us more information. We'll get to the bottom of it.`,
    helpButton: () => `CONTACT SUPPORT`,
  },
  // DepositAddressBottomSheet.tsx
  depositAddressBottom: {
    sheetHeader: () => `Deposit`,
    description: (tokenSymbol: string) =>
      `Send ${tokenSymbol} to your address below. Any other ERC-20 tokens will be converted to USDC. Confirm that you're sending:`,
    checkChain: {
      on: () => `On`,
      notOther: () => `, not any other chain`,
    },
    copied: () => `Copied`,
  },
  // FarcasterBottomSheet.tsx
  farcasterBottom: {
    verified: () => `Your account is verified`,
    linked: () => `Your account is linked`,
    connect: () => `Connect Farcaster`,
    openWarpcastButton: () => `OPEN IN WARPCAST`,
    welcome: (fcUsername: string) => `Welcome, ${fcUsername}`,
    loading: () => `Loading...`,
    removeFromProfile: () => `REMOVE FROM PROFILE`,
    addToProfile: () => `ADD TO PROFILE`,
  },
  // HelpBottomSheet.tsx
  helpBottom: {
    gotItButton: () => `GOT IT`,
  },
  // OnboardingChecklistBottomSheet.tsx
  onboardingChecklistBottom: {
    sheetHeader: () => `Onboarding checklist`,
    description: () => `Complete these items to finish account setup`,
    secureAccount: {
      title: () => `Secure your account`,
      description: () => `Add a backup to your account`,
    },
    connectFarcaster: {
      title: () => `Farcaster နှင့်ချိတ်ဆက်မည်`,
      description: () => `Import profile picture and connections`,
    },
    dismissButton: () => `DISMISS`,
  },
  // OwnRequestBottomSheet.tsx
  ownRequestBottom: {
    sheetHeader: () => `You requested`,
    cancelButton: () => `CANCEL REQUEST`,
  },
  // SwapBottomSheet.tsx
  swapBottom: {
    sheetHeader: () => `Accept`,
    acceptButton: () => `ACCEPT`,
  },
  // WithdrawInstructionsBottomSheet.tsx
  withdrawInstructionsBottom: {
    sheetHeader: () => `Withdraw`,
    wallet: {
      title: () => `Withdraw to another wallet`,
      description: () =>
        `Tap Send, then paste in your wallet address. Remember that you're sending USDC on Base.`,
    },
    coinbase: {
      title: () => `Coinbase သို့ထုတ်ယူမည်`,
      description: () => `Go to Coinbase, then tap `,
      steps: {
        sendReceive: () => `Send & Receive`,
        receive: () => `Receive`,
        choose: () => `Choose`,
        setNetwork: () => `Set Network to`,
      },
      sendToAddress: () =>
        `Use Daimo to send to the address shown. Funds should appear on Coinbase in a few minutes.`,
    },
  },

  // -------------------------- MISC --------------------------
  tabNav: {
    deposit: () => `ငွေဖြည့်ရန်`,
    invite: () => `ဖိတ်ခေါ်ရန်`,
    home: () => `မူလ`,
    send: () => `ငွေပို့ရန်`,
    settings: () => `ပြင်ဆင်ရန်`,
  },

  // view/sheet/ components
  sheets: {
    withdraw: () => `ထုတ်ယူမည်`,
    deposit: () => `ဖြည့်မည်`,
  },

  // view/shared components
  viewShared: {
    recents: () => `Recents`,
    searchResults: () => `Search results`,
  },
};

function pluralize(n: number, noun: string) {
  return `${n} ${noun}`; // "1 apple"
}
