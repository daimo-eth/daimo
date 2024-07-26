export interface LanguageDefinition {
  shared: {
    buttonStatus: {
      success: () => string;
      error: () => string;
      retry: () => string;
      sent: () => string;
      request: () => string;
    };
    buttonAction: {
      confirm: () => string;
      cancel: () => string;
      decline: () => string;
      request: () => string;
      send: () => string;
      accept: () => string;
      submit: () => string;
    };
    textPressable: {
      cancel: () => string;
    };
  };
  historyList: {
    empty: () => string;
    screenHeader: {
      default: () => string;
      other: () => string;
    };
    op: {
      cancelledLink: () => string;
      pending: () => string;
    };
  };
  historyOp: {
    shareLinkAgain: () => string;
    viewReceipt: () => string;
    opVerb: {
      createdLink: () => string;
      acceptedLink: () => string;
      receivedRequest: () => string;
      fulfilledRequest: () => string;
      cancelledLink: () => string;
      sent: () => string;
      received: () => string;
    };
    whyNoFees: {
      title: () => string;
      description: {
        firstPara: (chainName: any) => string;
        secondPara: () => string;
        thirdPara: () => string;
      };
    };
    feeText: {
      free: () => string;
      pending: () => string;
      fee: (amount: any) => string;
    };
  };
  addDevice: {
    screenHeader: () => string;
    headerDescription: () => string;
    scanQR: {
      error: () => string;
      scanned: (slot: any) => string;
      add: (slot: any) => string;
    };
  };
  addKeySlot: {
    userCancelled: () => string;
  };
  device: {
    deleted: () => string;
    remove: {
      title: (deviceName: any) => string;
      msg: () => string;
      remove: (deviceName: any) => string;
      cancel: () => string;
    };
    current: {
      cannotRemove: () => string;
      usingTitle: () => string;
      usingSubtitle: () => string;
    };
  };
  note: {
    payment: () => string;
    accept: {
      title: () => string;
      link: () => string;
      long: (dollars: any) => string;
      loading: () => string;
    };
    accepted: {
      title: () => string;
      link: () => string;
      long: (name: any) => string;
    };
    cancel: {
      title: () => string;
      link: () => string;
      long: (dollars: any) => string;
    };
    cancelled: {
      title: () => string;
      link: () => string;
      longSelf: () => string;
      longOther: () => string;
    };
    pending: {
      long: () => string;
    };
    gasTooHigh: () => string;
    invalid: () => string;
    send: {
      self: () => string;
      other: (name: any) => string;
    };
  };
  send_note: {
    title: () => string;
    help: {
      title: () => string;
      subtitle: () => string;
      description: {
        firstPara: () => string;
        secondPara: () => string;
        thirdPara: () => string;
        fourthPara: () => string;
      };
    };
    create: () => string;
  };
  invitesNotification: {
    description: (inviteCount: any) => string;
  };
  notifications: {
    screenHeader: () => string;
    noNotifications: () => string;
  };
  requestNotification: {
    msgVerb: {
      via: () => string;
      from: () => string;
      for: () => string;
    };
    requestState: {
      created: {
        self: () => string;
        other: () => string;
      };
      request: () => string;
      fulfilled: {
        self: () => string;
        other: () => string;
      };
      cancelled: {
        self: () => string;
        other: () => string;
      };
      declined: {
        self: () => string;
        other: () => string;
      };
    };
  };
  swapNotification: {
    msg: (readableAmount: any, coinName: any) => string;
  };
  allowNotifs: {
    screenHeader: () => string;
    allowButton: () => string;
    skipButton: () => string;
    instructions: () => string;
  };
  existingChooseAccount: {
    screenHeader: () => string;
    selectAccount: {
      placeholder: () => string;
      description: () => string;
    };
    searchResults: {
      empty: () => string;
    };
  };
  existing: {
    screenHeader: () => string;
    generatingKeys: () => string;
    scanQR: () => string;
    useBackup: () => string;
  };
  existingSeedPhrase: {
    screenHeader: () => string;
  };
  existingUseBackup: {
    screenHeader: () => string;
    description: () => string;
    logInWithSeedPhrase: () => string;
  };
  logIn: {
    button: (keyType: any) => string;
    fromSeed: {
      error: () => string;
      button: () => string;
    };
  };
  missingKey: {
    screenHeader: () => string;
    logOut: () => string;
    keyErrorDesc: {
      noKey: {
        title: () => string;
        desc: () => string;
      };
      removedKey: {
        title: () => string;
        desc: () => string;
      };
      unhandledKeyError: {
        title: () => string;
        desc: () => string;
      };
    };
  };
  onboardingChooseName: {
    screenHeader: () => string;
    instructions: () => string;
    picker: {
      title: () => string;
      createButton: () => string;
      generateRandom: () => string;
      error: () => string;
      taken: () => string;
      available: () => string;
    };
  };
  onboardingEnterInvite: {
    screenHeader: () => string;
    waitlistButton: () => string;
    instructions: () => string;
    inviteCode: {
      title: () => string;
      button: () => string;
    };
  };
  onboardingIntro: {
    title: () => string;
    subtitle: () => string;
    acceptInviteButton: () => string;
    alreadyHaveAccountButton: () => string;
    rows: {
      selfCustody: {
        title: () => string;
        description: () => string;
      };
      help: {
        button: () => string;
        description: () => string;
      };
      everywhere: {
        title: () => string;
        description: () => string;
      };
      onEthereum: {
        title: () => string;
        description: () => string;
      };
    };
    helpModalUSDC: {
      description: () => string;
      learnMore: () => string;
      here: () => string;
    };
  };
  onboardingSetupKey: {
    screenHeader: () => string;
    pin: {
      generateDescription: () => string;
      failedDescription: () => string;
      tryAgainButton: () => string;
      generateButton: () => string;
    };
  };
  receiveNav: {
    screenHeader: () => string;
  };
  receive: {
    screenHeader: () => string;
    sendRequest: {
      loading: () => string;
      title: () => string;
      subtitle: () => string;
    };
  };
  fulfillRequest: {
    disabledReason: {
      fulfilled: () => string;
      cancelled: () => string;
      self: () => string;
      insufficientFunds: () => string;
    };
    holdButton: () => string;
    statusMsg: {
      paymentsPublic: () => string;
      totalDollars: (dollars: any) => string;
    };
  };
  memoDisplay: {
    status: (status: any) => string;
    placeholder: () => string;
  };
  noteAction: {
    disabledReason: {
      insufficientFunds: () => string;
    };
    statusMsg: {
      totalDollars: (dollars: any) => string;
    };
    externalAction: {
      sms: () => string;
      email: () => string;
      paymentLink: () => string;
    };
    holdButton: () => string;
  };
  routeDisplay: {
    theyWillReceive: (amount: any, tokenSymbol: any) => string;
  };
  sendNav: {
    screenHeader: () => string;
  };
  sendNote: {
    screenHeader: () => string;
    info: (tokenSymbol: any) => string;
    help: {
      title: () => string;
      learn: () => string;
      subtitle: () => string;
      description: {
        firstPara: () => string;
        secondPara: () => string;
        thirdPara: () => string;
        fourthPara: () => string;
      };
    };
    enterAmount: () => string;
    createLinkButton: () => string;
  };
  sendTransferButton: {
    disabledReason: {
      insufficientFunds: () => string;
      self: () => string;
      other: () => string;
      zero: () => string;
      min: (minTransferAmount: any) => string;
    };
    holdButton: () => string;
    statusMsg: {
      insufficientFundsPlusFee: (totalStr: any) => string;
      insufficientFunds: () => string;
      totalDollars: (totalStr: any) => string;
      paymentsPublic: () => string;
    };
  };
  sendTransferScreen: {
    screenHeader: () => string;
    firstTime: (name: any) => string;
  };
  deposit: {
    screenHeader: () => string;
    go: () => string;
    continue: () => string;
    landline: {
      cta: () => string;
      title: () => string;
      optionRowTitle: (timeAgo: any) => string;
      startTransfer: () => string;
    };
    binance: {
      cta: () => string;
      title: () => string;
    };
    default: {
      cta: () => string;
      title: () => string;
    };
    loading: () => string;
    initiated: {
      title: () => string;
      subtitle: () => string;
    };
    withdraw: {
      cta: () => string;
      title: () => string;
    };
  };
  error: {
    banner: () => string;
  };
  home: {
    pending: (pendingDollars: any) => string;
    finishAccountSetUp: () => string;
  };
  invite: {
    screenHeader: () => string;
    more: (moreInvitees: any) => string;
    invited: (invited: any) => string;
    left: (usesLeft: any) => string;
    locked: {
      header: () => string;
      description: () => string;
    };
    sendButton: () => string;
    referral: {
      creditForInvite: (bonusSubtitle: any) => string;
      bonusBoth: (bonusDollarsInvitee: any) => string;
      bonusInvitee: (bonusDollarsInvitee: any) => string;
      bonusInviter: (bonusDollarsInviter: any) => string;
      inviteCode: () => string;
      inviteLink: () => string;
      share: {
        button: () => string;
        farcasterButton: () => string;
        farcasterMsg: () => string;
      };
    };
  };
  landlineBankTransfer: {
    warning: {
      title: () => string;
      minimum: () => string;
    };
  };
  profile: {
    screenHeader: () => string;
    error: {
      account: {
        title: () => string;
        msg: (account: any) => string;
      };
      invite: {
        title: () => string;
        msg: (code: any) => string;
      };
    };
    subtitle: {
      invitedBy: () => string;
      joined: (timeAgo: any) => string;
    };
  };
  qr: {
    title: {
      display: () => string;
      scan: () => string;
    };
    copiedAddress: () => string;
    depositButton: () => string;
  };
  seedPhrase: {
    title: {
      copy: () => string;
      verify: () => string;
    };
    description: () => string;
    button: {
      continue: () => string;
      finish: () => string;
    };
    copy: {
      confirm: () => string;
      clipboard: () => string;
    };
    verify: {
      description: () => string;
    };
  };
  settings: {
    screenHeader: () => string;
    showDetails: () => string;
    hideDetails: () => string;
    account: {
      connectFarcaster: () => string;
      viewAccountOnExplorer: () => string;
      noSocialsConnected: () => string;
    };
    devices: {
      title: () => string;
      thisDevice: () => string;
      passkeys: {
        title: () => string;
        description: {
          firstPara: () => string;
          secondPara: () => string;
        };
      };
      createBackup: {
        title: () => string;
        msg: () => string;
        button: () => string;
      };
      addDevice: {
        title: () => string;
        msg: () => string;
        button: () => string;
      };
      contactSupport: {
        title: () => string;
        msg: () => string;
        button: () => string;
      };
    };
    logOut: () => string;
    remove: () => string;
    pending: () => string;
    addedAgo: (timeAgo: any) => string;
    details: {
      title: () => string;
      enableNotifications: () => string;
      sendDebugLog: () => string;
    };
  };
  yourInvites: {
    screenHeader: () => string;
    joinedAgo: (timeAgo: any) => string;
  };
  amountInput: {
    dollarsAvailable: (dollars: any) => string;
  };
  offlineHeader: {
    header: () => string;
    retrying: () => string;
  };
  scanner: {
    enableCamera: () => string;
  };
  searchHeader: {
    searchUser: () => string;
  };
  searchResults: {
    noResults: () => string;
    paymentLinkButton: () => string;
    sentAgo: (timeAgo: any) => string;
    receivedAgo: (timeAgo: any) => string;
    extra: {
      contact: () => string;
      requestLink: () => string;
      sendLink: () => string;
      showQR: () => string;
      scanQR: () => string;
    };
  };
  searchScreen: {
    placeholderWithContact: () => string;
    placeholderWithoutContact: () => string;
  };
  createBackup: {
    default: {
      header: () => string;
      passkeyTitle: () => string;
      passkeyBullet1: () => string;
      passkeyBullet2: () => string;
      offlineInsteadButton: () => string;
    };
    offline: {
      header: () => string;
      securityKeyTitle: () => string;
      securityKeyBullet1: () => string;
      seedPhraseTitle: () => string;
      seedPhraseBullet1: () => string;
      seedPhraseButton: () => string;
    };
    addKey: {
      passkey: () => string;
      securityKey: () => string;
      button: (slotType: any) => string;
    };
    recommended: {
      compact: () => string;
      default: () => string;
    };
  };
  debugBottom: {
    sheetHeader: () => string;
    description: () => string;
    helpButton: () => string;
  };
  depositAddressBottom: {
    sheetHeader: () => string;
    description: (tokenSymbol: any) => string;
    checkChain: {
      on: () => string;
      notOther: () => string;
    };
    copied: () => string;
  };
  farcasterBottom: {
    verified: () => string;
    linked: () => string;
    connect: () => string;
    openWarpcastButton: () => string;
    welcome: (fcUsername: any) => string;
    loading: () => string;
  };
  helpBottom: {
    gotItButton: () => string;
  };
  onboardingChecklistBottom: {
    sheetHeader: () => string;
    description: () => string;
    secureAccount: {
      title: () => string;
      description: () => string;
    };
    connectFarcaster: {
      title: () => string;
      description: () => string;
    };
    dismissButton: () => string;
  };
  ownRequestBottom: {
    sheetHeader: () => string;
    cancelButton: () => string;
  };
  swapBottom: {
    sheetHeader: () => string;
  };
  withdrawInstructionsBottom: {
    sheetHeader: () => string;
    wallet: {
      title: () => string;
      description: () => string;
    };
    coinbase: {
      title: () => string;
      description: () => string;
      steps: {
        sendReceive: () => string;
        receive: () => string;
        choose: () => string;
        setNetwork: () => string;
      };
      sendToAddress: () => string;
    };
  };
  tabNav: {
    deposit: () => string;
    invite: () => string;
    home: () => string;
    send: () => string;
    settings: () => string;
  };
}
