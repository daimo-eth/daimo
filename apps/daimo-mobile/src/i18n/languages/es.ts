
export const en = {
  // Common text components
  shared: {
    buttonStatus: {
      success: () => `Success`,
      error: () => `Error`,
      retry: () => `Reintentar`,
      sent: () => `Envidado`,
      request: () => `Solicitar`,
    },
    buttonAction: {
      confirm: () => `Confirmar`,
      cancel: () => `Cancelar`,
      decline: () => `Rechazar`,
      request: () => `Solicitar`,
      send: () => `Enviar`,
      accept: () => `Aceptar`,
      submit: () => `Enviar`, // TODO: see the context
    },
    textPressable: {
      cancel: () => `Cancelar`,
    },
  },
  // -------------------------- SCREENS --------------------------
  // ------------ HISTORY ------------
  // HistoryList.tsx
  historyList: {
    empty: () => `Ninguna transacción aún`,
    screenHeader: {
      default: () => `Actividad reciente`,
      other: () => `Between you`, // TODO
    },
    op: {
      cancelledLink: () => `link cancelado`,
      pending: () => `Pendiente`,
    },
  },
  // HistoryOpScreen.tsx
  historyOp: {
    shareLinkAgain: () => `COMPARTIR LINK DE NUEVO`,
    viewReceipt: () => `VER RECIBO`,
    opVerb: {
      createdLink: () => `Link creado`,
      acceptedLink: () => `Link aceptado`,
      receivedRequest: () => `Petición recibida`,
      fulfilledRequest: () => `Petición satisfecha`,
      cancelledLink: () => `Cancelled link`,
      sent: () => `Enviado`,
      received: () => `Recivida`,
    },
    whyNoFees: {
      title: () => `Sobre esta transferencia`,
      description: {
        firstPara: ({ chainName }: { chainName: string }) =>
          `Esta transacción fue resuelta en ${chainName}, un rollup de Ethereum.`,
        secondPara: () =>
          `Las Rollups heredan la seguridad de Ethereum, a un coste menor.`,
        thirdPara: () =>
          `Las transacciones cuestan unos centimos. Daimo patrocinó esta transferencia, haciéndola gratuita.`,
      },
    },
    feeText: {
      free: () => `GRATIS`,
      pending: () => `PENDIENTE`,
      fee: ({ amount }: { amount: string }) => `${amount} TASA`,
    },
  },

  // ------------ KEYROTATION ------------
  // AddDeviceScreen.tsx
  addDevice: {
    screenHeader: () => `Añade Dispositivo`,
    headerDescription: () =>
      `Link a new device to your account by scanning its QR code during setup.`,
    scanQR: {
      error: () => `Error al procesar el código QR`,
      scanned: (slot: string) => `Escaneado ${slot}`,
      add: (slot: string) => `Añade ${slot}`,
    },
  },
  // AddKeySlotButton.tsx
  addKeySlot: {
    userCancelled: () => `Cancelado`,
  },
  // DeviceScreen.tsx
  device: {
    deleted: () => `Dispositivo eliminado`,
    remove: {
      title: (deviceName: string) => `Eliminar ${deviceName}\n`,
      msg: () => `Esta seguro que quiera eliminar este dispositivo?`,
      remove: (deviceName: string) => `Eliminar ${deviceName}`,
      cancel: () => `Cancelar`,
    },
    current: {
      cannotRemove: () =>
        `Este es su unico dispositivo. Transfiera su saldo a otro lugar antes de eliminarlo.`,
      usingTitle: () => `Esta usando este dispositivo`,
      usingSubtitle: () => `Eliminarlo de esta cuenta le cerrará la sesión`,
    },
  },

  // ------------ LINK ------------
  // NoteScreen.tsx
  note: {
    payment: () => `Link de Pago`,
    accept: {
      title: () => `Aceptar`,
      link: () => `Link aceptar`,
      long: (dollars: string) => `Aceptar este link, reciviendo ${dollars}`,
      loading: () => `Aceptando link...`,
    },
    accepted: {
      title: () => `Aceptado`,
      link: () => `Link Aceptado`,
      long: (name: string) => `Aceptado por ${name}`,
    },
    cancel: {
      title: () => `Cancelar`,
      link: () => `link cancelar`,
      long: (dollars: string) => `Cancelar este link, reclamando ${dollars}`,
    },
    cancelled: {
      title: () => `Cancelado`,
      link: () => `Link Cancelado`,
      longSelf: () => `Has cancelado este link de pago`,
      longOther: () => `Cancelado por emisor`,
    },
    pending: {
      long: () => `Link de pago no encontrado. Pendiente?`,
    },
    gasTooHigh: () => `El gas es muy caro para reclamar`,
    invalid: () => `Link de pago inválido`,
    send: {
      self: () => `has enviado`,
      other: (name: string) => `${name} enviado`,
    },
  },
  // SendNoteScreen.tsx
  send_note: {
    title: () => `Enviar link`,
    help: {
      title: () => `Aprende como`,
      subtitle: () => `Cómo funcionan los links de pago`,
      description: {
        firstPara: () =>
          `Links de pago transportan dinero en un link, que puedas enviarlo a cualquier persona.`,
        secondPara: () =>
          `Puedes cancelar un link sin reclamar y conseguir de vuelta los fondos.`,
        thirdPara: () => `Son auto-custodiales. La clave forma parte del URL.`,
        fourthPara: () =>
          `Cada link funciona como una invitación a Daimo. Además, cualquiera que tenga el link puede reclamar con cualquier cartera, como Rainbow o Metamask.`,
      },
    },
    create: () => `Crear Link de Pago`,
  },

  // ------------ NOTIFICATIONS ------------
  // InvitesNotificationRow.tsx
  invitesNotification: {
    description: (inviteCount: number) =>
      `Tienes ${pluralize(inviteCount, "invitación")} disponibles.`,
  },
  // NotificationsScreen.tsx
  notifications: {
    screenHeader: () => `Notificaciones`,
    noNotifications: () => `No notificaciones`,
  },
  // RequestNotificationRow.tsx
  requestNotification: {
    msgVerb: {
      via: () => `via`,
      from: () => `desde`,
      for: () => `para`,
    },
    // TODO: figure out a better way to do this
    requestState: {
      created: {
        self: () => `Ha Solicitado`,
        other: () => `solicitaste`,
      },
      request: () => `solicitud`,
      fulfilled: {
        self: () => `aceptada su`,
        other: () => `Has aceptado la solicitud de`,
      },
      cancelled: {
        self: () => `Ha cancelado su`,
        other: () => `cancelada su solicitud para `,
      },
      declined: {
        self: () => `rechazada su solicitud para`,
        other: () => `Ha rechazado una solicitud de `,
      },
    },
  },
  // SwapNotificationRow.tsx
  swapNotification: {
    msg: (readableAmount: string, coinName: string) =>
      `Aceptado ${readableAmount} ${coinName} de `,
  },

  // ------------ ONBOARDING ------------
  // AllowNotifsScreen.tsx
  allowNotifs: {
    screenHeader: () => `Notificaciones`,
    allowButton: () => `Permitir Notificaciones`,
    skipButton: () => `Saltar`,
    instructions: () =>
      `Serás solo notificado sobre actividad en tu cuenta.`,
  },
  // ExistingChooseAccountScreen.tsx
  existingChooseAccount: {
    screenHeader: () => `Cargar cuenta`,
    selectAccount: {
      placeholder: () => `Introduzca usuario...`,
      description: () => `Elija la cuenta que desea cargar`,
    },
    searchResults: {
      empty: () => `Sin resultados`,
    },
  },
  // ExistingScreen.tsx
  existing: {
    screenHeader: () => `Cuenta existente`,
    generatingKeys: () => `Generando claves...`,
    scanQR: () =>
      `Escanea este QR desde otro dispositivo para añadir este teléfono a una cuenta de Daimo.`,
    useBackup: () => `Usar Copia de Seguridad`,
  },
  // ExistingSeedPhraseScreen.tsx
  existingSeedPhrase: {
    screenHeader: () => `Inicie sesión con frase semilla`,
  },
  // ExistingUseBackupScreen.tsx
  existingUseBackup: {
    screenHeader: () => `Elija una opción de recuperación`,
    description: () =>
      `Inicie con una frase semilla.\nEsto añade tu dispositivo a la cuenta.`,
    logInWithSeedPhrase: () => `INICIE SESIÓN CON FRASE SEMILLA`,
  },
  // LogInButton.tsx
  logIn: {
    button: (keyType: string) => `I ${keyType}`,
    fromSeed: {
      error: () => `La frase semilla no fue encontrada. Eliminada?`,
      button: () => `INICIE SESIÓN CON FRASE SEMILLA`,
    },
  },
  // MissingKeyScreen.tsx
  missingKey: {
    screenHeader: () => `Clave faltante`,
    logOut: () => `CERRAR SESIÓN`,
    keyErrorDesc: {
      noKey: {
        title: () => `Nuevo teléfono?`,
        desc: () =>
          `Encontramos tu cuenta, pero no clave privada. Claves en hardware seguro nunca salen del dispositivo, asique no son transferidos cuando obtienes un nuevo móvil. Cierre sesión, e inicie sessión usando una clave de respaldo.`,
      },
      removedKey: {
        title: () => `Dispositivo eliminado`,
        desc: () =>
          `Parece que la clave de este dispositivo fue eliminado de tu cuenta. Cierre sesión, luego inice sesión con la clave de respaldo.`,
      },
      unhandledKeyError: {
        title: () => `Error de clave no gestionado`,
        desc: () => ``,
      },
    },
  },
  // OnboardingChooseNameScreen.tsx
  onboardingChooseName: {
    screenHeader: () => `Elija su Usuario`,
    instructions: () =>
      `Elija a un nombre de usuario que utilizará en Daimo. Tu usuario es publico.`,
    picker: {
      title: () => `elija un usuario`,
      createButton: () => `CREAR CUENTA`,
      generateRandom: () => `GENERAR RANDOM`,
      error: () => `sin conexión?`,
      taken: () => `lo sentimos, ese nombre no está disponible`,
      available: () => `disponible`,
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
    placeholder: () => `WHAT'S THIS FOR?`,
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
    theyWillReceive: (amount: string, tokenSymbol: string) =>
      `They will receive ${amount} ${tokenSymbol}`,
  },
  // SendNavScreen.tsx
  sendNav: {
    screenHeader: () => `Send`,
  },
  // SendNoteScreen.tsx
  sendNote: {
    screenHeader: () => `Send Link`,
    info: (tokenSymbol: string) => `Send ${tokenSymbol} via link`,
    help: {
      title: () => `How Payment Links Work`,
      learn: () => `Learn how`,
      subtitle: () => `Anyone with the link can claim`,
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
  },
  // ------------ MISC SCREENS ------------
  // DepositScreen.tsx
  deposit: {
    screenHeader: () => `Deposit or Withdraw`,
    landline: {
      cta: () => `Connect with Landline`,
      title: () => `Deposit or withdraw directly from a US bank account`,
      optionRowTitle: (timeAgo: string) => `Connected ${timeAgo} ago`,
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
  },
  // errorScreens.tsx
  error: {
    banner: () => `An error occurred`,
  },
  // HomeScreen.tsx
  home: {
    pending: (pendingDollars: string) => `+ $${pendingDollars} PENDING`,
    finishAccountSetUp: () => `Finish setting up your account`,
  },
  // InviteScreen.tsx
  invite: {
    screenHeader: () => `Invite Friends`,
    more: (moreInvitees: number) => `+${moreInvitees} more`,
    invited: ({ invited }: { invited: number }) =>
      `You've invited ${pluralize(invited, "friend")}`,
    left: () => `{usesLeft} invite{{s}} left`,
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
    warning: {
      title: () => `Withdrawals are public`,
      minimum: () => `Minimum withdrawal of 1 USDC`,
    },
  },
  // ProfileScreen.tsx
  profile: {
    screenHeader: () => `Profile`,
    // TODO: check if need status.data translations
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
        title: () => `What is a Passkey Backup?`,
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
      on: () => `On `,
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
  // AddrLabels for account history contacts
  addrLabel: {
    faucet: () => `team Daimo`,
    paymentLink: () => `payment link`,
    requestLink: () => `request link`,
    paymaster: () => `fee`,
    uniswapETHPool: () => `swapped ETH`,
  },

  tabNav: {
    deposit: () => `Deposit`,
    invite: () => `Invite`,
    home: () => `Home`,
    send: () => `Send`,
    settings: () => `Settings`,
  },
};


// TODO: adapt this function to sanish
function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 manzana"
  
  if (noun.slice(-3) === "ión") {
    return `${n} ${noun.slice(0, -3)}iones`; // "2 canciones" o "{n} canciones"
  }

  return `${n} ${noun}s`; // "2 manzanas" o "{n} manzanas"
}
