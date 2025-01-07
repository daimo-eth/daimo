import { LanguageDefinition, en } from "./en";

// Helper function for pluralization (Burmese doesn't use English pluralization rules)
function pluralize(n: number, noun: string): string {
  return `${n} ${noun}`;
}

// Import types from en.ts
type DeviceName = Parameters<typeof en.device.confirmation.titleRemoveDevice>[0];
type Dollars = Parameters<typeof en.note.accept.long>[0];
type Name = Parameters<typeof en.note.accepted.long>[0];
type Slot = Parameters<typeof en.addDevice.scanQR.scanned>[0];
type TimeAgo = Parameters<typeof en.settings.addedAgo>[0];
type TokenSymbol = Parameters<typeof en.depositAddressBottom.description>[0];
type SlotType = Parameters<typeof en.createBackup.addKey.button>[0];
type FcUsername = Parameters<typeof en.farcasterBottom.welcome>[0];

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
      titleRemoveDevice: (deviceName: string) => `ပယ်ဖျက် ${deviceName}\n`,
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
      usingSubtitle: () => `ယခုလုပ်ငန်းစဥ်ကိုဆောင်ရွက်မည်ဆိုပါက အကောင့်မှထွက်သွားမည်ဖြစ်ပါသည်`,
      deleteSubtitle: () =>
        `ယခု Device သည်သင့်အကောင့်တွင်တစ်ခုတည်းသာရှိပါသည်။ ပယ်ဖျက်ပါက သင့်အကောင့်ပါဖျက်သိမ်းသွားမည်ဖြစ်ပါသည်။`,
    },
  },
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
      long: (dollars: string) => `${dollars} ကိုပြန်လည်ရယူရန် ယခုLinkကိုဖျက်သိမ်းမည်`,
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
      cancelled: () => `တောင်းခံမှုကို ပယ်ဖျက်မည်`,
      self: () => `ကိုယ့်အကောင့်ကို ပြန်ပို့၍မရပါ။`,
      insufficientFunds: () => `လက်ကျန်ငွေမလုံလောက်ပါ `,
    },
    holdButton: () => `HOLD TO FULFILL`,
    statusMsg: {
      paymentsPublic: () => `Payments are public`,
      totalDollars: (dollars: typeof en.fulfillRequest.statusMsg.totalDollars.parameters[0]) => `Total incl. fees ${dollars}`,
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
      totalDollars: (dollars: typeof en.noteAction.statusMsg.totalDollars.parameters[0]) => `Total incl. fees ${dollars}`,
    },
    externalAction: {
      sms: () => `မက်ဆေ့ပို့ရန်`,
      email: () => `အီးမေးလ်ပို့ရန်`,
      paymentLink: () => `ငွေပေးချေရန်လင့်ကိုပေးပို့မည် `,
    },
    holdButton: () => `အတည်ပြုရန်နှိပ်ထားပါ`,
  },
  routeDisplay: {
    theyWillReceive: (amount: string, tokenSymbol: TokenSymbol, chainName: string) =>
      `They will receive ${amount} ${tokenSymbol} on ${chainName}`,
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
    msg: (readableAmount: string, coinName: string) => `Accept ${readableAmount} ${coinName} from `,
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
      scanQR: () => `QR ကုဒ်စကင်ဖတ်မည်`,
    },
  },
  invitesNotification: {
    description: (inviteCount: number) => `ဖိတ်ခေါ်မှု ${pluralize(inviteCount, "ခု")} ရရှိနိုင်ပါသည်`,
  },
  notifications: {
    screenHeader: () => `အသိပေးချက်`,
    noNotifications: () => `အသိပေးချက်အသစ်များမရှိပါ`,
  },
  requestNotification: {
    msg: (readableAmount: string) => `${readableAmount} တောင်းခံထားသည်`,
    msgVerb: {
      via: () => `မှတဆင့်`,
      from: () => `မှ`,
      for: () => `ဆီသို့`,
    },
    requestState: {
      created: {
        title: () => `တောင်းခံမှုဖန်တီးပြီးပါပြီ`,
        subtitle: () => `တောင်းခံမှုအားလက်ခံရန်စောင့်ဆိုင်းနေသည်`,
      },
      fulfilled: {
        title: () => `တောင်းခံမှုပြီးဆုံးပါပြီ`,
        subtitle: () => `တောင်းခံမှုအားလက်ခံပြီးပါပြီ`,
      },
      rejected: {
        title: () => `တောင်းခံမှုငြင်းပယ်ခံရပါပြီ`,
        subtitle: () => `တောင်းခံမှုအားငြင်းပယ်ခဲ့သည်`,
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
      passkeyTitle: () => `Passkey အရန်သိမ်းဆည်းမှုပြုလုပ်မည်`,
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
