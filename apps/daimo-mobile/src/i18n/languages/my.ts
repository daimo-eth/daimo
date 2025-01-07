import { LanguageDefinition, en } from "./en";

// Helper function for pluralization (Burmese doesn't use English pluralization rules)
function pluralize(n: number, noun: string): string {
  return `${n} ${noun}`;
}

// Import required types
type Name = Parameters<typeof en.note.accepted.long>[0];
type TokenSymbol = Parameters<typeof en.depositAddressBottom.description>[0];

// Burmese (Myanmar) translations
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
  sendUserOp: {
    loadingAccount: () => `Loading account...`,
    authorizing: () => `Authorizing...`,
    accepted: () => `လက်ခံလိုက်ပါပြီ`,
    offline: () => `လုပ်ငန်စဥ်မအောင်မြင်ပါ။ အင်တာနက်လိုင်းကျနေပါသလား?`,
    error: () => `ပေးပို့ရာတွင်တစ်စုံတစ်ခုအမှားအယွင်းရှိနေပါသည်`,
  },
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
  historyOp: {
    shareLinkAgain: () => `Linkကိုထပ်မံမျှဝေမည်`,
    viewReceipt: () => `ပေးပို့မှုမှတ်တမ်းကိုကြည့်ရှုမည်`,
    opVerb: {
      createdLink: () => `Created Link`,
      acceptedLink: () => `Accepted link`,
      receivedRequest: () => `Received request`,
      fulfilledRequest: () => `Fulfilled request`,
      cancelledLink: () => `Cancelled link`,
      sent: () => `ပေးပို့ပြီးပါပြီ`,
      received: () => `လက်ခံရရှိသည်`,
      deposited: () => `ငွေသွင်းပြီးပါပြီ`,
      depositing: () => `ငွေသွင်းနေပါသည်`,
      withdrew: () => `ငွေထုတ်ယူပြီးပါပြီ`,
      withdrawing: () => `ငွေထုတ်ယူနေပါသည်`,
    },
    feeText: {
      free: () => `အခမဲ့`,
      pending: () => `ဆောင်ရွက်နေဆဲ`,
      fee: (amount: string) => `${amount} ကောက်ခံမည်`,
    },
    fundArrivalTime: {
      deposit: () => `သင့်ငွေများ Daimo အကောင့်သို့ရောက်ရှိမည်`,
      withdrawal: () => `သင့်ငွေများဘဏ်အကောင့်သို့ရောက်ရှိမည်`,
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
          "ဤလုပ်ငန်းစဥ်သည် သင်၏ချိတ်ဆက်ထားသောဘဏ်အကောင့်မှ Daimo အကောင့်သို့ငွေလွှဲပေးပို့ခြင်းဖြစ်ပါသည်။",
        secondPara: () =>
          "ကျွန်ုပ်တို့၏မိတ်ဖက်မှငွေလက်ခံရရှိသည်နှင့် သင့်အကောင့်သို့ငွေလွှဲပေးပို့ပေးမည်ဖြစ်ပါသည်။",
        thirdPara: () =>
          "ဘဏ်မှတဆင့်ငွေလွှဲပေးပို့ခြင်းအတွက် ဒေါ်လာအနည်းငယ်ကုန်ကျမည်ဖြစ်သော်လည်း Daimo မှကုန်ကျစရိတ်ကိုကျခံပေးမည်ဖြစ်ပါသည်။",
      },
      landlineDepositCompleted: {
        firstPara: () =>
          "ဤလုပ်ငန်းစဥ်သည် သင်၏ချိတ်ဆက်ထားသောဘဏ်အကောင့်မှ Daimo အကောင့်သို့ငွေလွှဲပေးပို့ခြင်းဖြစ်ပါသည်။",
        secondPara: () =>
          "ဘဏ်မှတဆင့်ငွေလွှဲပေးပို့ခြင်းအတွက် ဒေါ်လာအနည်းငယ်ကုန်ကျမည်ဖြစ်သော်လည်း Daimo မှကုန်ကျစရိတ်ကိုကျခံပေးမည်ဖြစ်ပါသည်။",
      },
      landlineWithdrawalProcessing: {
        firstPara: () =>
          "ဤလုပ်ငန်းစဥ်သည် သင်၏ Daimo အကောင့်မှ ချိတ်ဆက်ထားသောဘဏ်အကောင့်သို့ငွေလွှဲပေးပို့ခြင်းဖြစ်ပါသည်။",
        secondPara: () =>
          "ငွေကြေးများကို ကျွန်ုပ်တို့၏မိတ်ဖက်လိပ်စာသို့လွှဲပြောင်းပေးပို့မည်ဖြစ်ပြီး ငွေလက်ခံရရှိသည်နှင့် သင့်ဘဏ်အကောင့်သို့ငွေလွှဲပေးပို့ပေးမည်ဖြစ်ပါသည်။",
        thirdPara: () =>
          "ဘဏ်မှတဆင့်ငွေလွှဲပေးပို့ခြင်းအတွက် ဒေါ်လာအနည်းငယ်ကုန်ကျမည်ဖြစ်သော်လည်း Daimo မှကုန်ကျစရိတ်ကိုကျခံပေးမည်ဖြစ်ပါသည်။",
      },
      landlineWithdrawalCompleted: {
        firstPara: () =>
          "ဤလုပ်ငန်းစဥ်သည် သင်၏ Daimo အကောင့်မှ ချိတ်ဆက်ထားသောဘဏ်အကောင့်သို့ငွေလွှဲပေးပို့ခြင်းဖြစ်ပါသည်။",
        secondPara: () =>
          "ဘဏ်မှတဆင့်ငွေလွှဲပေးပို့ခြင်းအတွက် ဒေါ်လာအနည်းငယ်ကုန်ကျမည်ဖြစ်သော်လည်း Daimo မှကုန်ကျစရိတ်ကိုကျခံပေးမည်ဖြစ်ပါသည်။",
      },
    },
  },
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
  addKeySlot: {
    userCancelled: () => `ပယ်ဖျက်မည်`,
  },
  device: {
    deleted: () => `ပယ်ဖျက်ထားသော Device များ`,
    confirmation: {
      titleRemoveDevice: (deviceName: Name) => `ပယ်ဖျက် ${deviceName}\n`,
      msgRemoveDevice: () => `ယခု Device ကို ပယ်ဖျက်ပါမည်လား`,
      titleDeleteAccount: () => `အကောင့်ကိုဖျက်သိမ်းမည်`,
      msgDeleteAccount: () => `သင့်အကောင့်ကိုဖျက်သိမ်းပါမည်လား`,

      remove: () => `ပယ်ဖျက်မည်`,
      cancel: () => `Cancel`,
    },
    current: {
      cannotRemove: () =>
        `ယခုအကောင့်သည်အခြားသော Device များနှင့်ချိတ်ဆက်ထားခြင်းမရှိသေးပါ။ ထို့ကြောင့် ဆုံးရှုံးမှုမဖြစ်ပွားစေရန် မပယ်ဖျက်မီလက်ကျန်ငွေကို ပြောင်းရွှေ့ထားရန်အကြံပြုပါသည်။ `,

      usingTitle: () => `You're using this device now`,
      deleteTitle: () => `အကောင့်ကိုဖျက်သိမ်းမည်`,
      usingSubtitle: () =>
        `ယခုလုပ်ငန်းစဥ်ကိုဆောင်ရွက်မည်ဆိုပါက အကောင့်မှထွက်သွားမည်ဖြစ်ပါသည်`,
      deleteSubtitle: () =>
        `ယခု Device သည်သင့်အကောင့်တွင်တစ်ခုတည်းသာရှိပါသည်။ ပယ်ဖျက်ပါက သင့်အကောင့်ပါဖျက်သိမ်းသွားမည်ဖြစ်ပါသည်။`,
    },
  },
  note: {
    payment: () => `ပေးချေရန် Link`,
    accept: {
      title: () => `လက်ခံမည်`,
      link: () => `Linkကိုလက်ခံမည်`,
      long: (dollars: TokenSymbol) => `ယခုLinkမှတဆင့် ${dollars} ကိုလက်ခံမည်`,

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
      other: (name: Name) => `${name} မှပေးပို့ထားပါသည်`,
    },
  },
  fulfillRequest: {
    disabledReason: {
      fulfilled: () => `တောင်းခံမှုပြီးဆုံးပါပြီ`,
      cancelled: () => `တောင်းခံမှုကို ပယ်ဖျက်မည်`,
      self: () => `ကိုယ့်အကောင့်ကို ပြန်ပို့၍မရပါ။`,
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ `,
    },
    holdButton: () => `HOLD TO FULFILL`,
    statusMsg: {
      paymentsPublic: () => `Payments are public`,
      totalDollars: (dollars: string) => `စုစုပေါင်းကုန်ကျစရိတ် ${dollars}`,
    },
  },
  memoDisplay: {
    status: (status: string) => `မှတ်ချက်ရေးရန် ${status}`,
    placeholder: () => `WHAT FOR?`,
  },
  noteAction: {
    disabledReason: {
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
    },
    statusMsg: {
      totalDollars: (dollars: TokenSymbol) =>
        `စုစုပေါင်းကုန်ကျစရိတ် ${dollars}`,
    },
    externalAction: {
      sms: () => `မက်ဆေ့ပို့ရန်`,
      email: () => `အီးမေးလ်ပို့ရန်`,
      paymentLink: () => `ငွေပေးချေရန်လင့်ကိုပေးပို့မည် `,
    },
    holdButton: () => `အတည်ပြုရန်နှိပ်ထားပါ`,
  },
  routeDisplay: {
    theyWillReceive: (
      amount: string,
      tokenSymbol: TokenSymbol,
      chainName: string
    ) => `They will receive ${amount} ${tokenSymbol} on ${chainName}`,
  },
  sendNav: {
    screenHeader: () => `Send`,
  },
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
  swapNotification: {
    msg: (readableAmount: string, coinName: string) =>
      `Accept ${readableAmount} ${coinName} from `,
  },
  profile: {
    screenHeader: () => `ပရိုဖိုင်`,
    error: {
      account: {
        title: () => `အကောင့်ရှာမတွေ့ပါ`,
        msg: (account: string) => `${account} အကောင့်အားရယူ၍မရပါ`,
      },
      invite: {
        title: () => `ဖိတ်ခေါ်မှုရှာမတွေ့ပါ`,
        msg: (code: string) => `${code} ဖိတ်ခေါ်မှုအားရယူ၍မရပါ`,
      },
    },
    subtitle: {
      invitedBy: () => `ဖိတ်ခေါ်သူ `,
      joined: (timeAgo: string) => `${timeAgo} တွင်ဝင်ရောက်ခဲ့သည်`,
    },
  },
  qr: {
    title: {
      display: () => `QR ကုဒ်ပြသရန်`,
      scan: () => `QR ကုဒ်စကင်ဖတ်ရန်`,
    },
    slider: {
      payMe: () => "ငွေပေးချေရန်",
      scan: () => "စကင်ဖတ်ရန်",
    },
    copiedAddress: () => `လိပ်စာကူးယူပြီးပါပြီ`,
    depositButton: () => `EXCHANGE မှငွေဖြည့်ရန် ›`,
  },
  seedPhrase: {
    title: {
      copy: () => `Seed phrase ကူးယူရန်`,
      verify: () => `Seed phrase အတည်ပြုရန်`,
    },
    description: () =>
      `ဤ seed phrase သည် သင့်အကောင့်သို့ထည့်သွင်းမည်ဖြစ်ပြီး သင့်စက်ပျောက်ဆုံးသွားသည့်တိုင် အကောင့်ပြန်လည်ရယူနိုင်မည်ဖြစ်သည်။`,
    button: {
      continue: () => `ဆက်လက်လုပ်ဆောင်မည်`,
      finish: () => `Setup ပြီးဆုံးပါပြီ`,
    },
    copy: {
      confirm: () => `ဤ seed phrase အား လုံခြုံစွာသိမ်းဆည်းပြီးပါပြီ`,
      clipboard: () => `CLIPBOARD သို့ကူးယူမည်`,
    },
    verify: {
      description: () => `သင့် seed phrase အား input box တွင်ရိုက်ထည့်ပါ။`,
    },
  },
  settings: {
    screenHeader: () => `ပြင်ဆင်ရန်`,
    showDetails: () => `အသေးစိတ်ပြရန်`,
    hideDetails: () => `အသေးစိတ်ဖျောက်ရန်`,
    account: {
      connectFarcaster: () => `FARCASTER နှင့်ချိတ်ဆက်မည်`,
      viewAccountOnExplorer: () => `EXPLORER တွင်အကောင့်ကြည့်မည်`,
      noSocialsConnected: () => `လူမှုကွန်ယက်များနှင့်မချိတ်ဆက်ရသေးပါ`,
    },
    devices: {
      title: () => `ကျွန်ုပ်၏စက်များနှင့် အရန်သိမ်းဆည်းမှုများ`,
      thisDevice: () => `ဤစက်`,
      passkeys: {
        title: () => `Passkey အရန်သိမ်းဆည်းခြင်းဆိုသည်မှာ အဘယ်နည်း။`,
        description: {
          firstPara: () =>
            `Passkeys သည် seed phrases များအတွက် အဆင်ပြေပြီး phishing ဒဏ်ခံနိုင်သော နည်းလမ်းတစ်ခုဖြစ်သည်`,
          secondPara: () =>
            `Passkeys များကို သင့်စကားဝှက်စီမံခန့်ခွဲသူတွင် ထုတ်လုပ်၍သိမ်းဆည်းထားပြီး သင့်စက်ပျောက်ဆုံးသွားသည့်တိုင် သင့်အကောင့်ကို ပြန်လည်ရယူနိုင်စေသည်။`,
        },
      },
      createBackup: {
        title: () => `အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
        msg: () => `Passkey၊ လုံခြုံရေးသော့ သို့မဟုတ် seed phrase`,
        button: () => `အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
      },
      addDevice: {
        title: () => `စက်တစ်ခုထည့်သွင်းမည်`,
        msg: () => `သင့်အကောင့်အား အခြားစက်တစ်ခုတွင်အသုံးပြုမည်`,
        button: () => `စက်ထည့်သွင်းမည်`,
      },
      contactSupport: {
        title: () => `မေးခွန်းများ? အကြံပြုချက်များ?`,
        msg: () => `Telegram တွင်ကျွန်ုပ်တို့ထံဆက်သွယ်ပါ`,
        button: () => `အထောက်အပံ့ဆက်သွယ်မည်`,
      },
    },
    logOut: () => `ထွက်မည်`,
    delete: () => `အကောင့်ဖျက်မည်`,
    remove: () => `ဖယ်ရှားမည်`,
    pending: () => `စောင့်ဆိုင်းနေသည်`,
    addedAgo: (timeAgo: string) => `${timeAgo} က ထည့်သွင်းခဲ့သည်`,
    details: {
      title: () => `စက်အသေးစိတ်အချက်လက်များ`,
      enableNotifications: () => `အကြောင်းကြားချက်များဖွင့်မည်`,
      sendDebugLog: () => `Debug log ပို့မည်`,
    },
  },
  amountInput: {
    dollarsAvailable: (dollars: string) => `${dollars} ရရှိနိုင်သည်`,
  },
  offlineHeader: {
    header: () => `အင်တာနက်မရှိပါ`,
    retrying: () => `ပြန်လည်ကြိုးစားနေသည်...`,
  },
  scanner: {
    enableCamera: () => `ကင်မရာအသုံးပြုခွင့်ပေးပါ`,
  },
  searchHeader: {
    searchUser: () => `အသုံးပြုသူရှာဖွေရန်...`,
  },
  searchResults: {
    noResults: () => `ရလဒ်မရှိပါ`,
    paymentLinkButton: () => `ပေးချေရန်လင့်ကိုအစားပို့မည်`,
    sentAgo: (timeAgo: string) => `${timeAgo} က ပို့ခဲ့သည်`,
    receivedAgo: (timeAgo: string) => `${timeAgo} က လက်ခံရရှိခဲ့သည်`,
    extra: {
      contact: () => `အဆက်အသွယ်သို့ပို့မည်`,
      requestLink: () => `လင့်မှတဆင့်တောင်းခံမည်`,
      sendLink: () => `လင့်မှတဆင့်ပို့မည်`,
      showQR: () => `QR ကုဒ်ပြမည်`,
      scanQR: () =>
        `QR ကုဒ်စကင်ဖတ်မည်`,
    },
  },
  invitesNotification: {
    description: (inviteCount: number) =>
      `ဖိတ်ခေါ်မှု ${pluralize(inviteCount, "ခု")} ရရှိနိုင်ပါသည်`,
  },
  notifications: {
    screenHeader: () => `အသိပေးချက်`,
    noNotifications: () => `အသိပေးချက်အသစ်များမရှိပါ`,
  },
  allowNotifs: {
    screenHeader: () => `အကြောင်းကြားချက်များ`,
    allowButton: () => `အကြောင်းကြားချက်များခွင့်ပြုမည်`,
    skipButton: () =>
      `ကျော်မည်`,
    instructions: () =>
      `သင့်အကောင့်လှုပ်ရှားမှုများအတွက်သာ အကြောင်းကြားချက်များရရှိမည်ဖြစ်သည်။`,
  },
  home: {
    pending: (pendingDollars: string) =>
      `+ $${pendingDollars} စောင့်ဆိုင်းနေသည်`,
    finishAccountSetUp: () =>
      `သင့်အကောင့်လုံခြုံအောင်ပြုလုပ်ပါ`,
    yourBalance: () => `သင့်လက်ကျန်ငွေ`,
    deposit: () => `ငွေသွင်းမည်`,
    request: () => `တောင်းခံမည်`,
    send: () => `ပေးပို့မည်`,
  },
  invite: {
    screenHeader: () => `သူငယ်ချင်းများကိုဖိတ်ခေါ်မည်`,
    more: (moreInvitees: number) => `+${moreInvitees} ဦးထပ်ရှိသည်`,
    invited: (invited: number) =>
      `သင်သည် သူငယ်ချင်း ${pluralize(invited, "ဦး")} ကိုဖိတ်ခေါ်ထားပါသည်`,
    left: (usesLeft: number) =>
      `${pluralize(usesLeft, "ခု")} ဖိတ်ခေါ်ခွင့်ကျန်ရှိသည်`,
    locked: {
      header: () => `သူငယ်ချင်းများကိုဖိတ်ခေါ်ပြီး USDC ရယူပါ!`,
      description: () =>
        `ဖိတ်ခေါ်ခွင့်ရရှိရန် Daimo ကိုပိုမိုအသုံးပြုပါ။ သင့်အဆက်အသွယ်များကိုဖိတ်ခေါ်ရန် ငွေပေးချေမှုလင့်ကိုပေးပို့ပါ။`,
    },
    sendButton: () => `ပို့မည်`,
    referral: {
      creditForInvite: (bonusSubtitle: string) =>
        `သူတို့၏ပရိုဖိုင်တွင် ဖိတ်ခေါ်မှုအတွက်ခရက်ဒစ်ရမည် ${bonusSubtitle}`,
      bonusBoth: (bonusDollarsInvitee: number) =>
        `ထို့အပြင် သင်နှင့်သူတို့နှစ်ဦးစလုံး $${bonusDollarsInvitee} USDC ရရှိမည်`,
      bonusInvitee: (bonusDollarsInvitee: number) =>
        `ထို့အပြင် သူတို့သည် $${bonusDollarsInvitee} USDC ရရှိမည်`,
      bonusInviter: (bonusDollarsInviter: number) =>
        `ထို့အပြင် သင်သည် $${bonusDollarsInviter} USDC ရရှိမည်`,
      inviteCode: () => `ဖိတ်ခေါ်မှုကုဒ်`,
      inviteLink: () => `ဖိတ်ခေါ်မှုလင့်`,
      share: {
        button: () => `လင့်မျှဝေမည်`,
        farcasterButton: () => `FARCASTER တွင် FRAME မျှဝေမည်`,
        farcasterMsg: () => `Daimo+တွင်+ပါဝင်ပါ`,
      },
    },
  },
  landlineBankTransfer: {
    title: {
      deposit: () => `မှငွေသွင်းမည်`,
      withdraw: () => `သို့ငွေထုတ်မည်`,
    },
    warning: {
      titleDeposit: () => `ငွေသွင်းခြင်းများသည် အများပြည်သူသိရှိနိုင်သည်`,
      titleWithdraw: () => `ငွေထုတ်ခြင်းများသည် အများပြည်သူသိရှိနိုင်သည်`,
      minimumDeposit: () => `အနည်းဆုံး 1 USD ငွေသွင်းရမည်`,
      minimumWithdraw: () => `အနည်းဆုံး 1 USDC ငွေထုတ်ရမည်`,
    },
    depositStatus: {
      shouldFastFinish: () => `ငွေများချက်ချင်းရောက်ရှိမည်။`,
      txLimit: () =>
        `ဤငွေသွင်းမှုသည် ချက်ချင်းငွေသွင်းနိုင်သည့်ပမာဏ ($1000) ထက်ကျော်လွန်နေပါသည်။ ငွေများသည် 1-3 ရက်အတွင်းရောက်ရှိမည်။`,
      monthlyLimit: () =>
        `ဤငွေသွင်းမှုသည် သင့်လစဥ်ချက်ချင်းငွေသွင်းနိုင်သည့်ပမာဏ ($5000/လ) ထက်ကျော်လွန်မည်ဖြစ်သည်။ ငွေများသည် 1-3 ရက်အတွင်းရောက်ရှိမည်။`,
      maxDeposit: () => `အများဆုံးငွေသွင်းနိုင်သည့်ပမာဏ`,
    },
    withdrawStatus: {
      standard: () => `ငွေများသည် 3 ရက်အတွင်းရောက်ရှိမည်။`,
      maxWithdrawal: () =>
        `အများဆုံးငွေထုတ်နိုင်သည့်ပမာဏ`,
    },
  },
  yourInvites: {
    screenHeader: () => `သင့်ဖိတ်ခေါ်မှုများ`,
    joinedAgo: (timeAgo: string) => `${timeAgo} ကပါဝင်ခဲ့သည်`,
  },
  searchScreen: {
    placeholderWithContact: () => `အသုံးပြုသူ၊ ENS၊ အဆက်အသွယ် သို့မဟုတ် အီးမေးလ်ရှာဖွေရန်...`,
    placeholderWithoutContact: () => `အသုံးပြုသူ၊ ENS၊ အီးမေးလ် သို့မဟုတ် ဖုန်းနံပါတ်ရှာဖွေရန်...`,
    cancel: () => `ပယ်ဖျက်မည်`,
  },
  debugBottom: {
    sheetHeader: () => `တစ်စုံတစ်ခုမှားယွင်းနေပါသလား။`,
    description: () =>
      `Telegram တွင်ကျွန်ုပ်တို့ထံဆက်သွယ်ပြီး Debug Log ပို့ရန်နှိပ်၍ အချက်အလက်များပို့ပါ။ ကျွန်ုပ်တို့မှဖြေရှင်းပေးပါမည်။`,
    helpButton: () => `အထောက်အပံ့ဆက်သွယ်မည်`,
  },
  depositAddressBottom: {
    sheetHeader: () => `ငွေသွင်းမည်`,
    description: (tokenSymbol: string) =>
      `${tokenSymbol} ကိုအောက်ပါလိပ်စာသို့ပို့ပါ။ အခြား ERC-20 tokens များကို USDC သို့ပြောင်းလဲပေးမည်။ အောက်ပါအချက်များကိုအတည်ပြုပါ:`,
    checkChain: {
      on: () => `ပေါ်တွင်`,
      notOther: () => `၊ အခြားကွင်းဆက်မဟုတ်ပါ`,
    },
    copied: () => `ကူးယူပြီးပါပြီ`,
  },
  farcasterBottom: {
    verified: () => `သင့်အကောင့်အတည်ပြုပြီးပါပြီ`,
    linked: () => `သင့်အကောင့်ချိတ်ဆက်ပြီးပါပြီ`,
    connect: () => `Farcaster နှင့်ချိတ်ဆက်မည်`,
    openWarpcastButton: () => `WARPCAST တွင်ဖွင့်မည်`,
    welcome: (fcUsername: string) => `ကြိုဆိုပါသည် ${fcUsername}`,
    loading: () => `ဆောင်ရွက်နေပါသည်...`,
    removeFromProfile: () =>
      `ပရိုဖိုင်မှဖယ်ရှားမည်`,
    addToProfile: () =>
      `ပရိုဖိုင်သို့ထည့်သွင်းမည်`,
  },
  helpBottom: {
    gotItButton: () => `နားလည်ပါပြီ`,
  },
  onboardingChecklistBottom: {
    sheetHeader: () => `အကောင့်စတင်အသုံးပြုခြင်းစာရင်း`,
    description: () => `အကောင့်စတင်အသုံးပြုရန် အောက်ပါအချက်များပြီးစီးအောင်ဆောင်ရွက်ပါ`,
    secureAccount: {
      title: () => `သင့်အကောင့်လုံခြုံအောင်ပြုလုပ်ပါ`,
      description: () => `သင့်အကောင့်တွင် အရန်သိမ်းဆည်းမှုထည့်သွင်းပါ`,
    },
    connectFarcaster: {
      title: () => `Farcaster နှင့်ချိတ်ဆက်မည်`,
      description: () => `ပရိုဖိုင်ဓာတ်ပုံနှင့် ချိတ်ဆက်မှုများတင်သွင်းမည်`,
    },
    dismissButton: () => `ပယ်ဖျက်မည်`,
  },
  ownRequestBottom: {
    sheetHeader: () => `သင်တောင်းခံထားသည်`,
    cancelButton: () => `တောင်းခံမှုပယ်ဖျက်မည်`,
  },
  swapBottom: {
    sheetHeader: () => `လက်ခံမည်`,
    acceptButton: () => `လက်ခံမည်`,
  },
  withdrawInstructionsBottom: {
    sheetHeader: () => `ငွေထုတ်မည်`,
    wallet: {
      title: () => `အခြားပိုက်ဆံအိတ်သို့ငွေထုတ်မည်`,
      description: () =>
        `ပို့မည်ကိုနှိပ်ပြီး သင့်ပိုက်ဆံအိတ်လိပ်စာကိုကူးထည့်ပါ။ Base ပေါ်တွင် USDC ပို့နေကြောင်းသတိရပါ။`,
    },
    coinbase: {
      title: () => `Coinbase သို့ငွေထုတ်မည်`,
      description: () => `Coinbase သို့သွားပြီး နှိပ်ပါ `,
      steps: {
        sendReceive: () => `ပို့မည် & လက်ခံမည်`,
        receive: () => `လက်ခံမည်`,
        choose: () => `ရွေးချယ်မည်`,
        setNetwork: () => `ကွန်ယက်ကိုသတ်မှတ်မည်`,
      },
      sendToAddress: () =>
        `Daimo မှပြသထားသောလိပ်စာသို့ပို့ပါ။ ငွေများသည် မိနစ်အနည်းငယ်အတွင်း Coinbase တွင်ပေါ်လာပါမည်။`,
    },
  },
  settingsModal: {
    modalTitle: () => `ပြင်ဆင်မှုများတွင်ခွင့်ပြုချက်ပေးပါ`,
    modalBody: ({ settingPhrase }: { settingPhrase: string }) =>
      `Settings » Daimo သို့သွား၍ ${settingPhrase} ကိုဖွင့်ပါ။`,
    settingPhrase: {
      contacts: () => `အဆက်အသွယ်များ`,
      notifications: () => `အကြောင်းကြားချက်များ`,
      camera: () => `ကင်မရာအသုံးပြုခွင့်`,
    },
  },
  existingChooseAccount: {
    screenHeader: () => `အကောင့်ရယူမည်`,
    selectAccount: {
      placeholder: () => `အသုံးပြုသူအမည်ထည့်သွင်းပါ...`,
      description: () => `မည်သည့်အကောင့်သို့ဝင်ရောက်မည်ကိုရွေးချယ်ပါ။`,
    },
    searchResults: {
      empty: () => `ရလဒ်မရှိပါ`,
    },
  },
  existing: {
    screenHeader: () => `ရှိပြီးသားအကောင့်`,
    generatingKeys: () => `သော့များထုတ်လုပ်နေသည်...`,
    scanQR: () =>
      `ရှိပြီးသား Daimo အကောင့်တွင် ဤဖုန်းကိုထည့်သွင်းရန် အခြားစက်မှ ဤ QR ကုဒ်ကိုစကင်ဖတ်ပါ။ သင့် Daimo Settings > စက်ထည့်သွင်းမည် သို့သွား၍စကင်ဖတ်ပါ။`,
    useBackup: () => `အရန်သိမ်းဆည်းမှုအသုံးပြုမည်`,
  },
  existingSeedPhrase: {
    screenHeader: () =>
      `Seed phrase ဖြင့်ဝင်ရောက်မည်`,
  },
  existingUseBackup: {
    screenHeader: () =>
      `ပြန်လည်ရယူရန်နည်းလမ်းရွေးချယ်ပါ`,
    description: () =>
      `အရန်သော့ဖြင့်ဝင်ရောက်မည်။\nဤလုပ်ဆောင်ချက်သည် သင့်စက်ကို အကောင့်သို့ထည့်သွင်းပေးမည်ဖြစ်သည်။`,
    logInWithSeedPhrase: () => `SEED PHRASE ဖြင့်ဝင်ရောက်မည်`,
  },
  logIn: {
    logIn: () => `ဝင်ရောက်မည်`,
    logInWith: ({ keyType }: { keyType: string }) => `${keyType} ဖြင့်ဝင်ရောက်မည်`,
    type: {
      securityKey: () => `လုံခြုံရေးသော့`,
      passkey: () => `PASSKEY`,
    },
    fromSeed: {
      error: () => `Seed phrase မရှိတော့ပါ။ ဖယ်ရှားထားပါသလား?`,
      button: () => `SEED PHRASE ဖြင့်ဝင်ရောက်မည်`,
    },
  },
  missingKey: {
    screenHeader: () => `သော့ပျောက်ဆုံးနေသည်`,
    logOut: () => `ထွက်မည်`,
    keyErrorDesc: {
      noKey: {
        title: () => `ဖုန်းအသစ်လား?`,
        desc: () =>
          `သင့်အကောင့်ကိုတွေ့ရှိသော်လည်း စက်သော့မရှိပါ။ လုံခြုံရေးစနစ်တွင်ရှိသော သော့များသည် သင့်စက်မှထွက်ခွာခြင်းမရှိသောကြောင့် ဖုန်းအသစ်ပြောင်းသည့်အခါ ပါလာမည်မဟုတ်ပါ။ ထွက်ပြီးနောက် အရန်သော့ဖြင့်ပြန်လည်ဝင်ရောက်ပါ။`,
      },
      removedKey: {
        title: () => `စက်ကိုဖယ်ရှားထားသည်`,
        desc: () =>
          `ဤစက်ရှိသော့ကို သင့်အကောင့်မှဖယ်ရှားထားပုံရသည်။ ထွက်ပြီးနောက် အရန်သော့ဖြင့်ပြန်လည်ဝင်ရောက်ပါ။`,
      },
      unhandledKeyError: {
        title: () => `မသိရှိသောသော့အမှား`,
        desc: () => ``,
      },
    },
  },
  onboardingChooseName: {
    screenHeader: () => `အသုံးပြုသူအမည်ရွေးချယ်ပါ`,
    instructions: () =>
      `Daimo တွင်အသုံးပြုမည့် အသုံးပြုသူအမည်ကိုရွေးချယ်ပါ။ သင့်အသုံးပြုသူအမည်သည် အများပြည်သူကြည့်ရှုနိုင်ပြီး blockchain ပေါ်တွင်ရှိနေမည်ဖြစ်သည်။`,
    picker: {
      title: () => `အသုံးပြုသူအမည်ရွေးချယ်ပါ`,
      createButton: () => `အကောင့်ဖန်တီးမည်`,
      generateRandom: () => `ကျပန်းထုတ်ယူမည်`,
      error: () => `အင်တာနက်မရှိပါ`,
      taken: () => `ဝမ်းနည်းပါသည်၊ ထိုအမည်ကိုအသုံးပြုပြီးဖြစ်ပါသည်`,
      available: () => `အသုံးပြုနိုင်ပါသည်`,
    },
  },
  onboardingEnterInvite: {
    screenHeader: () => `ဖိတ်ခေါ်မှုကုဒ်ထည့်သွင်းပါ`,
    waitlistButton: () => `စောင့်ဆိုင်းစာရင်းသွင်းမည်`,
    instructions: () =>
      `သင့်ဖိတ်ခေါ်မှုကုဒ်ကိုအောက်တွင်ရိုက်ထည့်ပါ သို့မဟုတ် လင့်ကိုကူးထည့်ပါ။\nကုဒ်မရှိပါက စောင့်ဆိုင်းစာရင်းသွင်းပါ။`,
    inviteCode: {
      title: () => `ဖိတ်ခေါ်မှုကုဒ်ထည့်သွင်းပါ`,
      button: () => `တင်သွင်းမည်`,
    },
  },
  onboardingIntro: {
    title: () => `Daimo သို့ကြိုဆိုပါသည်`,
    subtitle: () => `မည်သည့်နေရာတွင်မဆို USDC ပေးပို့ရယူနိုင်သည်`,
    acceptInviteButton: () => `ဖိတ်ခေါ်မှုလက်ခံမည်`,
    alreadyHaveAccountButton: () => `အကောင့်ရှိပြီးသားလား?`,
    rows: {
      selfCustody: {
        title: () =>
        `သင့်သော့၊ သင့်ငွေကြေး`,
        description: () => `Base ပေါ်ရှိ USDC။`,
      },
      help: {
        button: () => `ပိုမိုလေ့လာမည်`,
        description: () => `USDC သည်မည်သို့အလုပ်လုပ်သနည်း?`,
      },
      everywhere: {
        title: () => `နေရာတိုင်းတွင်အသုံးပြုနိုင်သည်`,
        description: () => `မည်သည့်အဆက်အသွယ်ထံသို့မဆို ချက်ချင်း၊ ၂၄/၇ လွှဲပြောင်းနိုင်သည်`,
      },
      onEthereum: {
        title: () => `Ethereum ပေါ်တွင်အလုပ်လုပ်သည်`,
        description: () => `Daimo သည် Base၊ rollup တစ်ခုပေါ်တွင်အလုပ်လုပ်သည်`,
      },
    },
    helpModalUSDC: {
      description: () =>
        `USDC သည် စည်းမျဥ်းစည်းကမ်းနှင့်အညီ ဒစ်ဂျစ်တယ်ငွေကြေးဖြစ်ပြီး အမေရိကန်ဒေါ်လာနှင့် ၁:၁ အချိုးဖြင့် အမြဲလဲလှယ်နိုင်သည်။`,
      learnMore: () => `USDC အကြောင်းပိုမိုလေ့လာရန်`,
      here: () => `ဤနေရာတွင်`,
    },
  },
  onboardingSetupKey: {
    screenHeader: () => `စက်ပစ္စည်းပြင်ဆင်မည်`,
    pin: {
      generateDescription: () =>
        `သင့် Daimo စက်သော့ကိုထုတ်လုပ်ပါ။ ဤသော့သည် သင့်စက်တွင်ထုတ်လုပ်၍သိမ်းဆည်းထားပြီး သင့် Daimo အကောင့်သို့ဝင်ရောက်ခွင့်ကိုလုံခြုံစေသည်။`,
      failedDescription: () =>
        `အထောက်အထားစိစစ်မှုမအောင်မြင်ပါ။ သင့်ဖုန်းတွင် လုံခြုံသောမျက်နှာပြင်သော့ချခြင်းထားရှိပါသလား? သင့် Daimo အကောင့်ကိုလုံခြုံစေရန် လိုအပ်ပါသည်။`,
      tryAgainButton: () => `ထပ်မံကြိုးစားမည်`,
      generateButton: () => `ထုတ်လုပ်မည်`,
    },
  },
  receiveNav: {
    screenHeader: () =>
      `တောင်းခံမည်`,
  },
  receive: {
    screenHeader: () => `တောင်းခံမည်မှ`,
    sendRequest: {
      loading: () => `တောင်းခံနေသည်...`,
      title: () => `တောင်းခံမှုလင့်ပို့မည်`,
      subtitle: () => `မည်သည့်မက်ဆေ့ချ်အက်ပ်မှမဆို တစ်စုံတစ်ဦးထံမှ USDC တောင်းခံနိုင်သည်`,
    },
  },
  sendTransferButton: {
    disabledReason: {
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
      self: () => `ကိုယ့်ကိုယ်ကို ပို့၍မရပါ`,
      other: () => `ဤအကောင့်သို့ပို့၍မရပါ`,
      zero: () =>
        `ပမာဏထည့်သွင်းပါ`,
      min: (minTransferAmount: number) =>
        `အနည်းဆုံးလွှဲပြောင်းနိုင်သည့်ပမာဏမှာ ${minTransferAmount} USDC ဖြစ်သည်`,
    },
    holdButton: () => `ပို့ရန်နှိပ်ထားပါ`,
    statusMsg: {
      insufficientFundsPlusFee: (totalStr: string) =>
        `ပို့ရန်အနည်းဆုံး ${totalStr} လိုအပ်ပါသည်`,
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ`,
      totalDollars: (totalStr: string) => `ကုန်ကျစရိတ်အပါအဝင် စုစုပေါင်း ${totalStr}`,
      paymentsPublic: () => `ငွေပေးချေမှုများသည် အများပြည်သူကြည့်ရှုနိုင်ပါသည်`,
    },
  },
  sendTransferScreen: {
    screenHeader: () => `ပို့မည်သို့`,
    firstTime: (name: string) => `${name} သို့ပထမဆုံးအကြိမ်ငွေပေးချေခြင်း`,
    memo: () => `မှတ်ချက်`,
    sendAs: () => `အဖြစ်ပို့မည်`,
  },
  contactDisplay: {
    requestedBy: () => `တောင်းခံသူ`,
  },
  landlineDepositButton: {
    holdButton: () => "ငွေဖြည့်ရန်နှိပ်ထားပါ",
    depositStatus: {
      creating: () => "ငွေဖြည့်ခြင်းပြုလုပ်နေသည်",
      success: () => "ငွေဖြည့်ခြင်းအောင်မြင်ပါသည်!",
      failed: () =>
        "ငွေဖြည့်ခြင်းမအောင်မြင်ပါ",
    },
  },
  deposit: {
    screenHeader: () => `ငွေဖြည့်မည် သို့မဟုတ် ထုတ်ယူမည်`,
    go: () => `သွားမည်`,
    continue: () => `ဆက်လက်လုပ်ဆောင်မည်`,
    landline: {
      cta: () => `Landline နှင့်ချိတ်ဆက်မည်`,
      title: () => `အမေရိကန်ဘဏ်အကောင့်မှ တိုက်ရိုက်ငွေဖြည့်ခြင်း သို့မဟုတ် ထုတ်ယူခြင်း`,
      optionRowTitle: (timeAgo: string) =>
        `${timeAgo} ${timeAgo === "now" ? "" : "က"} ချိတ်ဆက်ခဲ့သည်`,
      startTransfer: () => `လွှဲပြောင်းမှုစတင်မည်`,
    },
    binance: {
      cta: () => `Binance မှငွေဖြည့်မည်`,
      title: () => `Binance လက်ကျန်ငွေမှပေးပို့မည်`,
    },
    default: {
      cta: () => `လိပ်စာသို့ငွေဖြည့်မည်`,
      title: () => `သင့်လိပ်စာသို့ပို့မည်`,
    },
    loading: () =>
      `ဖွင့်နေသည်...`,
    initiated: {
      title: () => `ငွေဖြည့်ခြင်းစတင်ပြီးပါပြီ`,
      subtitle: () =>
        `ဘရောက်ဇာတွင်ပြီးဆုံးအောင်လုပ်ဆောင်ပါ၊ ထို့နောက် ငွေကြေးများသည် မိနစ်အနည်းငယ်အတွင်းရောက်ရှိလာပါမည်။`,
    },
    withdraw: {
      cta: () => `ထုတ်ယူမည်`,
      title: () => `မည်သည့်ပိုက်ဆံအိတ် သို့မဟုတ် လဲလှယ်ရေးသို့မဆို ထုတ်ယူနိုင်သည်`,
    },
    bitrefill: {
      cta: () => `Bitrefill ဖြင့်ထုတ်ယူမည်`,
      title: () => `USDC ဖြင့်လက်ဆောင်ကတ်များဝယ်ယူမည်`,
      success: () => `အောင်မြင်ပါသည်၊ အတည်ပြုချက်စောင့်ဆိုင်းနေသည်`,
    },
  },
  error: {
    banner: () => `အမှားတစ်ခုဖြစ်ပွားခဲ့သည်`,
  },
  requestNotification: {
    msgVerb: {
      via: () => `မှတဆင့်`,
      from: () => `မှ`,
      for: () => `ဆီသို့`,
    },
    requestState: {
      created: {
        self: () => `တောင်းခံမှုဖန်တီးပြီးပါပြီ`,
        other: () => `တောင်းခံမှုအားလက်ခံရန်စောင့်ဆိုင်းနေသည်`,
      },
      request: () => `တောင်းခံမှု`,
      fulfilled: {
        self: () => `တောင်းခံမှုပြီးဆုံးပါပြီ`,
        other: () => `တောင်းခံမှုအားလက်ခံပြီးပါပြီ`,
      },
      cancelled: {
        self: () => `တောင်းခံမှုကိုပယ်ဖျက်ပြီးပါပြီ`,
        other: () => `တောင်းခံမှုကိုပယ်ဖျက်ခဲ့သည်`,
      },
      declined: {
        self: () => `တောင်းခံမှုငြင်းပယ်ခံရပါပြီ`,
        other: () => `တောင်းခံမှုအားငြင်းပယ်ခဲ့သည်`,
      },
    },
  },

  tabNav: {
    deposit: () => `ငွေသွင်းမည်`,
    invite: () => `ဖိတ်ခေါ်မည်`,
    home: () => `ပင်မစာမျက်နှာ`,
    send: () => `ပေးပို့မည်`,
    settings: () => `ပြင်ဆင်ရန်`,
  },
  sheets: {
    withdraw: () => `ငွေထုတ်မည်`,
    deposit: () => `ငွေသွင်းမည်`,
  },
  viewShared: {
    recents: () => `မကြာသေးမီက`,
    searchResults: () => `ရှာဖွေမှုရလဒ်များ`,
  },
  createBackup: {
    default: {
      header: () => `အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
      passkeyTitle: () =>
        `Passkey အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
      passkeyBullet1: () => `အဆင်ပြေ၊ လုံခြုံ၊ phishing ဒဏ်ခံနိုင်သော`,
      passkeyBullet2: () =>
        `သင့်စကားဝှက်စီမံခန့်ခွဲသူတွင် သိမ်းဆည်းထားသည်၊ ဥပမာ iCloud Keychain သို့မဟုတ် 1Password`,
      offlineInsteadButton: () => `အင်တာနက်မရှိဘဲအရန်သိမ်းဆည်းမည်`,
    },
    offline: {
      header: () => `အင်တာနက်မရှိဘဲအရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
      securityKeyTitle: () => `လုံခြုံရေးသော့အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
      securityKeyBullet1: () => `ရုပ်ပိုင်းဆိုင်ရာ FIDO သော့တစ်ခု၊ ဥပမာ YubiKey တစ်ခုအသုံးပြုပါ`,
      seedPhraseTitle: () => `Seed phrase တစ်ခုထားရှိမည်`,
      seedPhraseBullet1: () =>
        `သင့်ငွေများသည် သင်လုံခြုံစွာသိမ်းဆည်းနိုင်သော စကားစုတစ်ခုနှင့်ချိတ်ဆက်ထားသည်`,
      seedPhraseButton: () => `Seed phrase ဖြင့်အရန်သိမ်းဆည်းမည်`,
    },
    addKey: {
      passkey: () => `PASSKEY`,
      securityKey: () => `လုံခြုံရေးသော့`,
      button: (slotType: string) => `${slotType} ဖြင့်အရန်သိမ်းဆည်းမည်`,
    },
    recommended: {
      compact: () => `အကြံပြုထားသည်`,
      default: () => `အကြံပြုထားသည်`,
    },
  },
};
