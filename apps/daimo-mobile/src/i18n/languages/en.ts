export const en = {
  // Common text components
  shared: {
    buttonStatus: {
      success: () => `Success`,
      error: () => `Error`,
      retry: () => `Retry`,
      sent: () => `Sent`,
      request: () => `Request`,
    },
    buttonAction: {
      confirm: () => `Confirm`,
      cancel: () => `Cancel`,
      decline: () => `Decline`,
      request: () => `Request`,
      send: () => `Send`,
      accept: () => `Accept`,
      submit: () => `Submit`,
      continue: () => `Continue`,
    },
    textPressable: {
      cancel: () => `Cancel`,
    },
  },
  // useSendAsync for sending userops
  sendUserOp: {
    loadingAccount: () => `Loading account...`,
    authorizing: () => `Authorizing...`,
    accepted: () => `Accepted`,
    offline: () => `Request failed. Offline?`,
    error: () => `Error sending transaction`,
  },
  // -------------------------- SCREENS --------------------------
  // ------------ HISTORY ------------
  // HistoryList.tsx
  historyList: {
    empty: () => `No transactions yet`,
    screenHeader: {
      default: () => `Recent activity`,
      other: () => `Between you`,
    },
    op: {
      cancelledLink: () => `cancelled link`,
      pending: () => `Pending`,
    },
  },
  // HistoryOpScreen.tsx
  historyOp: {
    shareLinkAgain: () => `SHARE LINK AGAIN`,
    viewReceipt: () => `VIEW RECEIPT`,
    opVerb: {
      createdLink: () => `Created link`,
      acceptedLink: () => `Accepted link`,
      receivedRequest: () => `Received request`,
      fulfilledRequest: () => `Fulfilled request`,
      cancelledLink: () => `Cancelled link`,
      sent: () => `Sent`,
      received: () => `Received`,
      deposited: () => `Deposited`,
      depositing: () => `Depositing`,
      withdrew: () => `Withdrew`,
      withdrawing: () => `Withdrawing`,
    },
    help: {
      title: () => `About this transfer`,
      whyNoFees: {
        firstPara: (chainName: string) =>
          `This transaction settled on ${chainName}, an Ethereum rollup.`,
        firstPara2Chain: (chainA: string, chainB: string) =>
          `This transaction settled on ${chainA} and ${chainB}.`,
        secondPara: () =>
          `Rollups inherit the strong security guarantees of Ethereum, at lower cost.`,
        thirdPara: () =>
          `Transactions cost a few cents. Daimo sponsored this transfer, making it free.`,
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
    screenHeader: () => `Add Device`,
    headerDescription: () =>
      `Link a new device to your account by scanning its QR code during setup.`,
    scanQR: {
      error: () => `Error Parsing QR Code`,
      scanned: (slot: string) => `Scanned ${slot}`,
      add: (slot: string) => `Add ${slot}`,
    },
  },
  // AddKeySlotButton.tsx
  addKeySlot: {
    userCancelled: () => `Cancelled`,
  },
  // DeviceScreen.tsx
  device: {
    deleted: () => `Deleted device`,
    confirmation: {
      titleRemoveDevice: (deviceName: string) => `Remove ${deviceName}\n`,
      msgRemoveDevice: () => `Are you sure you want to remove this device?`,
      titleDeleteAccount: () => `Delete Account`,
      msgDeleteAccount: () => `Are you sure you want to delete your account?`,
      remove: () => `Remove`,
      cancel: () => `Cancel`,
    },
    current: {
      cannotRemove: () =>
        `This is your only device. Transfer your balance elsewhere before deleting your account.`,
      usingTitle: () => `You're using this device now`,
      deleteTitle: () => `Delete your account`,
      usingSubtitle: () => `Removing it from this account will log you out`,
      deleteSubtitle: () =>
        `This is your only device. Removing it will delete your account.`,
    },
  },

  // ------------ LINK ------------
  // NoteScreen.tsx
  note: {
    payment: () => `Payment Link`,
    accept: {
      title: () => `Accept`,
      link: () => `Accept link`,
      long: (dollars: string) => `Accept this link, receiving ${dollars}`,
      loading: () => `Accepting link...`,
    },
    accepted: {
      title: () => `Accepted`,
      link: () => `Accepted Link`,
      long: (name: string) => `Accepted by ${name}`,
    },
    cancel: {
      title: () => `Cancel`,
      link: () => `Cancel link`,
      long: (dollars: string) => `Cancel this link, reclaiming ${dollars}`,
    },
    cancelled: {
      title: () => `Cancelled`,
      link: () => `Cancelled Link`,
      longSelf: () => `You cancelled this payment link`,
      longOther: () => `Cancelled by sender`,
    },
    pending: {
      long: () => `Payment link not found. Pending?`,
    },
    gasTooHigh: () => `Gas too high to claim`,
    invalid: () => `Payment link invalid`,
    send: {
      self: () => `you sent`,
      other: (name: string) => `${name} sent`,
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
    screenHeader: () => `Notifications`,
    noNotifications: () => `No notifications`,
  },
  // RequestNotificationRow.tsx
  requestNotification: {
    msgVerb: {
      via: () => `via`,
      from: () => `from`,
      for: () => `for`,
    },
    requestState: {
      created: {
        self: () => `You requested`,
        other: () => `requested`,
      },
      request: () => `request`,
      fulfilled: {
        self: () => `fulfilled your`,
        other: () => `You fulfilled a request from`,
      },
      cancelled: {
        self: () => `You cancelled your`,
        other: () => `cancelled their request for `,
      },
      declined: {
        self: () => `declined your request for`,
        other: () => `You declined a request from `,
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
    screenHeader: () => `Notifications`,
    allowButton: () => `Allow Notifications`,
    skipButton: () => `Skip`,
    instructions: () =>
      `You will only be notified about activity on your account.`,
  },
  // settings.ts
  settingsModal: {
    modalTitle: () => `Enable access in Settings`,
    modalBody: ({ settingPhrase }: { settingPhrase: string }) =>
      `Visit Settings » Daimo and enable ${settingPhrase}.`,
    settingPhrase: {
      contacts: () => `contacts`,
      notifications: () => `notifications`,
      camera: () => `camera access`,
    },
  },
  // ExistingChooseAccountScreen.tsx
  existingChooseAccount: {
    screenHeader: () => `Load account`,
    selectAccount: {
      placeholder: () => `Enter username...`,
      description: () => `Choose which account you're logging in to.`,
    },
    searchResults: {
      empty: () => `No results`,
    },
  },
  // ExistingScreen.tsx
  existing: {
    screenHeader: () => `Existing Account`,
    generatingKeys: () => `Generating keys...`,
    scanQR: () =>
      `Scan this QR code from another device to add this phone to an existing Daimo account. Go to your Daimo Settings > Add a Device to scan.`,
    useBackup: () => `Use Backup`,
  },
  // ExistingSeedPhraseScreen.tsx
  existingSeedPhrase: {
    screenHeader: () => `Log in with seed phrase`,
  },
  // ExistingUseBackupScreen.tsx
  existingUseBackup: {
    screenHeader: () => `Choose a recovery option`,
    description: () =>
      `Log in with a backup key.\nThis adds your device to the account.`,
    logInWithSeedPhrase: () => `LOG IN WITH SEED PHRASE`,
  },
  // LogInButton.tsx
  logIn: {
    logIn: () => `LOG IN`,
    logInWith: ({ keyType }: { keyType: string }) => `LOG IN WITH ${keyType}`,
    type: {
      securityKey: () => `SECURITY KEY`,
      passkey: () => `PASSKEY`,
    },
    fromSeed: {
      error: () => `Seed phrase not on account. Removed?`,
      button: () => `LOG IN WITH SEED PHRASE`,
    },
  },
  // MissingKeyScreen.tsx
  missingKey: {
    screenHeader: () => `Missing Key`,
    logOut: () => `LOG OUT`,
    keyErrorDesc: {
      noKey: {
        title: () => `New phone?`,
        desc: () =>
          `We found your account, but no device key. Keys in secure hardware never leave your device, so they don't transfer when you get a new phone. Log out, then log in using a backup key.`,
      },
      removedKey: {
        title: () => `Device removed`,
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
    screenHeader: () => `Choose Username`,
    instructions: () =>
      `Choose a username you'll go by on Daimo. Your username is public & on-chain.`,
    picker: {
      title: () => `choose a username`,
      createButton: () => `CREATE ACCOUNT`,
      generateRandom: () => `GENERATE RANDOM`,
      error: () => `offline?`,
      taken: () => `sorry, that name is taken`,
      available: () => `available`,
    },
  },
  // OnboardingEnterInviteScreen.tsx
  onboardingEnterInvite: {
    screenHeader: () => `Enter Invite Code`,
    waitlistButton: () => `JOIN WAITLIST`,
    instructions: () =>
      `Type your invite code below or paste a link.\nJoin the waitlist if you don't have a code.`,
    inviteCode: {
      title: () => `enter invite code`,
      button: () => `Submit`,
    },
  },
  // OnboardingIntroScreen.tsx
  onboardingIntro: {
    title: () => `Welcome to Daimo`,
    subtitle: () => `Pay or receive USDC anywhere`,
    acceptInviteButton: () => `ACCEPT INVITE`,
    alreadyHaveAccountButton: () => `ALREADY HAVE AN ACCOUNT?`,
    rows: {
      selfCustody: {
        title: () => `Your keys, your coins`,
        description: () => `USDC on Base.`,
      },
      help: {
        button: () => `Learn more`,
        description: () => `How does USDC work?`,
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
        `USDC is a regulated, digital currency that can always be redeemed 1:1 for US dollars.`,
      learnMore: () => `Learn more about USDC`,
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
      subtitle: () => `Request USDC from someone using any messaging app`,
    },
  },

  // ------------ SEND ------------
  // FulfillRequestButton.tsx
  fulfillRequest: {
    disabledReason: {
      fulfilled: () => `Request already fulfilled`,
      cancelled: () => `Request cancelled`,
      self: () => `Can't send to yourself`,
      insufficientFunds: () => `Insufficient funds`,
    },
    holdButton: () => `HOLD TO FULFILL`,
    statusMsg: {
      paymentsPublic: () => `Payments are public`,
      totalDollars: (dollars: string) => `Total incl. fees ${dollars}`,
    },
  },
  // MemoDisplay.tsx
  memoDisplay: {
    status: (status: string) => `memo ${status}`,
    placeholder: () => `WHAT FOR?`,
  },
  // NoteAction.tsx
  noteAction: {
    disabledReason: {
      insufficientFunds: () => `Insufficient funds`,
    },
    statusMsg: {
      totalDollars: (dollars: string) => `Total incl. fees ${dollars}`,
    },
    externalAction: {
      sms: () => `SEND SMS`,
      email: () => `SEND MAIL`,
      paymentLink: () => `SEND PAYMENT LINK`,
    },
    holdButton: () => `HOLD TO CONFIRM`,
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
    enterAmount: () => `Enter amount`,
    createLinkButton: () => `Create Payment Link`,
  },
  // SendTransferButton.tsx
  sendTransferButton: {
    disabledReason: {
      insufficientFunds: () => `Insufficient funds`,
      self: () => `Can't send to yourself`,
      other: () => `Can't send to this account`,
      zero: () => `Enter an amount`,
      min: (minTransferAmount: number) =>
        `Minimum transfer amount is ${minTransferAmount} USDC`,
    },
    holdButton: () => `HOLD TO SEND`,
    statusMsg: {
      insufficientFundsPlusFee: (totalStr: string) =>
        `You need at least ${totalStr} to send`,
      insufficientFunds: () => `Insufficient funds`,
      totalDollars: (totalStr: string) => `Total with fees ${totalStr}`,
      paymentsPublic: () => `Payments are public`,
    },
  },
  // SendTransferScreen.tsx
  sendTransferScreen: {
    screenHeader: () => `Send to`,
    firstTime: (name: string) => `First time paying ${name}`,
    memo: () => `Memo`,
    sendAs: () => `Send as`,
  },
  contactDisplay: {
    requestedBy: () => `Requested by`,
  },
  // LandlineDepositButton.tsx
  landlineDepositButton: {
    holdButton: () => "HOLD TO DEPOSIT",
    depositStatus: {
      creating: () => "Creating deposit",
      success: () => "Deposit successful!",
      failed: () => "Deposit failed",
    },
  },
  // ------------ MISC SCREENS ------------
  // DepositScreen.tsx
  deposit: {
    screenHeader: () => `Deposit or Withdraw`,
    go: () => `Go`,
    continue: () => `Continue`,
    landline: {
      cta: () => `Connect with Landline`,
      title: () => `Deposit or withdraw directly from a US bank account`,
      optionRowTitle: (timeAgo: string) =>
        `Connected ${timeAgo} ${timeAgo === "now" ? "" : "ago"}`,
      startTransfer: () => `Start transfer`,
    },
    binance: {
      cta: () => `Deposit from Binance`,
      title: () => `Send from Binance balance`,
    },
    default: {
      cta: () => `Deposit to address`,
      title: () => `Send to your address`,
    },
    loading: () => `loading...`,
    initiated: {
      title: () => `Deposit initiated`,
      subtitle: () =>
        `Complete in browser, then funds should arrive in a few minutes.`,
    },
    withdraw: {
      cta: () => `Withdraw`,
      title: () => `Withdraw to any wallet or exchange`,
    },
    bitrefill: {
      cta: () => `Withdraw with Bitrefill`,
      title: () => `Buy gift cards with USDC`,
      success: () => `success, waiting for confirmation`,
    },
  },
  // errorScreens.tsx
  error: {
    banner: () => `An error occurred`,
  },
  // HomeScreen.tsx
  home: {
    pending: (pendingDollars: string) => `+ $${pendingDollars} PENDING`,
    finishAccountSetUp: () => `Secure your account`,
    yourBalance: () => `Your balance`,
    deposit: () => `Deposit`,
    request: () => `Request`,
    send: () => `Send`,
  },
  // InviteScreen.tsx
  invite: {
    screenHeader: () => `Invite Friends`,
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
        title: () => `Create a Backup`,
        msg: () => `Passkey, security key, or seed phrase`,
        button: () => `CREATE BACKUP`,
      },
      addDevice: {
        title: () => `Add a Device`,
        msg: () => `Use your account on another device`,
        button: () => `ADD DEVICE`,
      },
      contactSupport: {
        title: () => `Questions? Feedback?`,
        msg: () => `Contact us on Telegram`,
        button: () => `CONTACT SUPPORT`,
      },
    },
    logOut: () => `Log out`,
    delete: () => `Delete account`,
    remove: () => `Remove`,
    pending: () => `Pending`,
    addedAgo: (timeAgo: string) => `Added ${timeAgo}`,
    details: {
      title: () => `Device details`,
      enableNotifications: () => `Enable notifications`,
      sendDebugLog: () => `Send debug log`,
    },
  },
  // YourInvitesScreen.tsx
  yourInvites: {
    screenHeader: () => `Your Invites`,
    joinedAgo: (timeAgo: string) => `Joined ${timeAgo} ago`,
  },

  // -------------------------- SHARED --------------------------
  // AmountInput.tsx
  amountInput: {
    dollarsAvailable: (dollars: string) => `${dollars} available`,
  },
  // OfflineHeader.tsx
  offlineHeader: {
    header: () => `Offline`,
    retrying: () => `Retrying...`,
  },
  // Scanner.tsx
  scanner: {
    enableCamera: () => `Enable camera access`,
  },
  // SearchHeader.tsx
  searchHeader: {
    searchUser: () => `Search for user...`,
  },
  // SearchResults.tsx
  searchResults: {
    noResults: () => `No results`,
    paymentLinkButton: () => `SEND PAYMENT LINK INSTEAD`,
    sentAgo: (timeAgo: string) => `Sent ${timeAgo}`,
    receivedAgo: (timeAgo: string) => `Received ${timeAgo}`,
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
      header: () => `Create a backup`,
      passkeyTitle: () => `Set up a passkey backup`,
      passkeyBullet1: () => `Convenient, secure, and resistant to phishing`,
      passkeyBullet2: () =>
        `Stored by your password manager, like iCloud Keychain or 1Password`,
      offlineInsteadButton: () => `Back up offline instead`,
    },
    offline: {
      header: () => `Create an offline backup`,
      securityKeyTitle: () => `Set up a security key backup`,
      securityKeyBullet1: () => `Use a physical FIDO key, such as a YubiKey`,
      seedPhraseTitle: () => `Set up a seed phrase`,
      seedPhraseBullet1: () =>
        `Your funds are connected to a phrase you can store securely`,
      seedPhraseButton: () => `Backup with seed phrase`,
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
      title: () => `Connect Farcaster`,
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
      title: () => `Withdraw to Coinbase`,
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
    deposit: () => `Deposit`,
    invite: () => `Invite`,
    home: () => `Home`,
    send: () => `Send`,
    settings: () => `Settings`,
  },

  // view/sheet/ components
  sheets: {
    withdraw: () => `Withdraw`,
    deposit: () => `Deposit`,
  },

  // view/shared components
  viewShared: {
    recents: () => `Recents`,
    searchResults: () => `Search results`,
  },
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 apple"
  return `${n} ${noun}s`; // "0 apples" or "2 apples"
}

export type LanguageDefinition = typeof en;
