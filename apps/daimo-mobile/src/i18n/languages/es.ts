import { LanguageDefinition } from "./en";

export const es: LanguageDefinition = {
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
      submit: () => `Enviar`,
      continue: () => `Continuar`,
    },
    textPressable: {
      cancel: () => `Cancelar`,
    },
  },
  // useSendAsync for sending userops
  sendUserOp: {
    loadingAccount: () => `Cargando cuenta...`,
    authorizing: () => `Autorizando...`,
    accepted: () => `Aceptado`,
    offline: () => `Solicitud fallida. ¿Sin conexión?`,
    error: () => `Error al enviar la transacción`,
  },
  // -------------------------- SCREENS --------------------------
  // ------------ HISTORY ------------
  // HistoryList.tsx
  historyList: {
    empty: () => `Ninguna transacción`,
    screenHeader: {
      default: () => `Actividad reciente`,
      other: () => `Entre ustedes`,
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
      cancelledLink: () => `Link cancelado`,
      sent: () => `Enviado`,
      received: () => `Recibida`,
      deposited: () => `Depositado`,
      depositing: () => `Depositando`,
      withdrew: () => `Retirado`,
      withdrawing: () => `Retirando`,
    },
    help: {
      title: () => `Sobre esta transferencia`,
      whyNoFees: {
        firstPara: (chainName: string) =>
          `Esta transacción fue resuelta en ${chainName}, un rollup de Ethereum.`,
        firstPara2Chain: (chainA: string, chainB: string) =>
          `Esta transacción fue resuelta en ${chainA} y ${chainB}.`,
        secondPara: () =>
          `Las Rollups heredan la seguridad de Ethereum, a un coste menor.`,
        thirdPara: () =>
          `Las transacciones cuestan unos centimos. Daimo patrocinó esta transferencia, haciéndola gratuita.`,
      },
      landlineDepositProcessing: {
        firstPara: () =>
          "Esta transacción transfiere fondos desde tu cuenta bancaria vinculada a tu cuenta Daimo.",
        secondPara: () =>
          "Una vez que nuestro socio reciba los fondos, realizaremos una transferencia en cadena para depositar los fondos en tu cuenta Daimo.",
        thirdPara: () =>
          "Las transferencias bancarias normalmente cuestan unos dólares. Daimo patrocinó esta transferencia, haciéndola gratuita.",
      },
      landlineDepositCompleted: {
        firstPara: () =>
          "Esta transacción transfirió fondos desde tu cuenta bancaria vinculada a tu cuenta Daimo.",
        secondPara: () =>
          "Las transferencias bancarias normalmente cuestan unos dólares. Daimo patrocinó esta transferencia, haciéndola gratuita.",
      },
      landlineWithdrawalProcessing: {
        firstPara: () =>
          "Esta transacción transfiere fondos desde tu cuenta Daimo a tu cuenta bancaria vinculada.",
        secondPara: () =>
          "Los fondos se transfieren en cadena a la dirección de nuestro socio. Una vez recibidos los fondos, iniciamos una transferencia bancaria a tu cuenta bancaria.",
        thirdPara: () =>
          "Las transferencias bancarias normalmente cuestan unos dólares. Daimo patrocinó esta transferencia, haciéndola gratuita.",
      },
      landlineWithdrawalCompleted: {
        firstPara: () =>
          "Esta transacción transfirió fondos desde tu cuenta Daimo a tu cuenta bancaria vinculada.",
        secondPara: () =>
          "Las transferencias bancarias normalmente cuestan unos dólares. Daimo patrocinó esta transferencia, haciéndola gratuita.",
      },
    },
    feeText: {
      free: () => `GRATIS`,
      pending: () => `PENDIENTE`,
      fee: (amount: string) => `${amount} TASA`,
    },
    fundArrivalTime: {
      deposit: () => `Sus fondos llegarán a su cuenta Daimo`,
      withdrawal: () => `Sus fondos llegarán a su cuenta bancaria`,
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
    confirmation: {
      titleRemoveDevice: (deviceName: string) => `Eliminar ${deviceName}\n`,
      msgRemoveDevice: () =>
        `Esta seguro que quiera eliminar este dispositivo?`,
      titleDeleteAccount: () => `Eliminar Su Cuenta`,
      msgDeleteAccount: () => `Esta seguro que quiera eliminar su cuenta?`,
      remove: () => `Eliminar`,
      cancel: () => `Cancelar`,
    },
    current: {
      cannotRemove: () =>
        `Este es su unico dispositivo. Transfiera su saldo a otro lugar antes de eliminar su cuenta.`,
      usingTitle: () => `Esta usando este dispositivo`,
      deleteTitle: () => `Eliminar su cuenta`,
      usingSubtitle: () => `Eliminarlo de esta cuenta le cerrará la sesión`,
      deleteSubtitle: () =>
        `Este es tu único dispositivo. Eliminarlo eliminará su cuenta.`,
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

  // ------------ NOTIFICATIONS ------------
  // InvitesNotificationRow.tsx
  invitesNotification: {
    description: (inviteCount: number) =>
      `Tienes ${pluralize(inviteCount, "invitación")} disponibles.`,
  },
  // NotificationsScreen.tsx
  notifications: {
    screenHeader: () => `Notificaciones`,
    noNotifications: () => `Ninguna notificación`,
  },
  // RequestNotificationRow.tsx
  requestNotification: {
    msgVerb: {
      via: () => `via`,
      from: () => `desde`,
      for: () => `para`,
    },
    requestState: {
      created: {
        self: () => `Ha solicitado`,
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
    instructions: () => `Serás solo notificado sobre actividad en tu cuenta.`,
  },
  // settings.ts
  settingsModal: {
    modalTitle: () => `Activar acceso en Configuración`,
    modalBody: ({ settingPhrase }: { settingPhrase: string }) =>
      `Visita Configuración » Daimo y activa ${settingPhrase}.`,
    settingPhrase: {
      contacts: () => `contactos`,
      notifications: () => `notificaciones`,
      camera: () => `acceso a la cámara`,
    },
  },
  // ExistingChooseAccountScreen.tsx
  existingChooseAccount: {
    screenHeader: () => `Cargar cuenta`,
    selectAccount: {
      placeholder: () => `Introduzca usuario...`,
      description: () => `Elija la cuenta que desea cargar`,
    },
    searchResults: {
      empty: () => `Ningún usuario encontrado`,
    },
  },
  // ExistingScreen.tsx
  existing: {
    screenHeader: () => `Cuenta existente`,
    generatingKeys: () => `Generando claves...`,
    scanQR: () =>
      `Escanea este QR desde otro dispositivo para añadir este teléfono a una cuenta de Daimo. Ve a tu Configuración de Daimo > Agregar un dispositivo para escanear.`,
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
    logIn: () => `INICIAR SESIÓN`,
    logInWith: ({ keyType }: { keyType: string }) =>
      `INICIAR SESIÓN CON ${keyType}`,
    type: {
      passkey: () => `LLAVE DE ACCESO`,
      securityKey: () => `CLAVE DE SEG.`,
    },
    fromSeed: {
      error: () => `La frase semilla no fue encontrada. Eliminada?`,
      button: () => `INICIAR SESIÓN CON FRASE SEMILLA`,
    },
  },
  // MissingKeyScreen.tsx
  missingKey: {
    screenHeader: () => `Clave ausente`,
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
      `Elija a un nombre de usuario que utilizará en Daimo. Tu usuario es publico & en cadena.`,
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
    screenHeader: () => `Introduzca el Código de Invitación`,
    waitlistButton: () => `UNIRSE A LA LISTA DE ESPERA`,
    instructions: () =>
      `Introduzca su código debajo o pegue un link.\nÚnase a la lista de espera si no tiene uno.`,
    inviteCode: {
      title: () => `Introduzca el código de invitación`,
      button: () => `Enviar`,
    },
  },
  // OnboardingIntroScreen.tsx
  onboardingIntro: {
    title: () => `Bienvenido a Daimo`,
    subtitle: () => `Pague o reciva USDC donde sea`,
    acceptInviteButton: () => `ACEPTAR INVITACIÓN`,
    alreadyHaveAccountButton: () => `YA TIENE UNA CUENTA?`,
    rows: {
      selfCustody: {
        title: () => `Tus llaves, tus tokens`,
        description: () => `USDC en Base.`,
      },
      help: {
        button: () => `Aprenda más`,
        description: () => `Cómo funciona USDC?`,
      },
      everywhere: {
        title: () => `Funciona en todas partes`,
        description: () => `Instantáneo, 24/7 envíos`,
      },
      onEthereum: {
        title: () => `Se ejecuta en Ethereum`,
        description: () => `Daimo se ejecuta en Base, un rollup`,
      },
    },
    helpModalUSDC: {
      description: () =>
        `USDC es una moneda digital regulada, que puede ser siempre cambiada 1:1 con dólares americanos.`,
      learnMore: () => `Aprenda más sobre USDC`,
      here: () => `aquí`,
    },
  },
  // OnboardingSetupKeyPage.tsx
  onboardingSetupKey: {
    screenHeader: () => `Configurar dispositivo`,
    pin: {
      generateDescription: () =>
        `Genere tu clave de dispositivo Daimo. Esta clave es generada y guardada seguramente en tu dispositivo, y asegura aceso a su cuenta Daimo.`,
      failedDescription: () =>
        `Autentificación faillida. Su dispositivo tiene método seguro de acceso? Necesitará uno para asegurar su cuenta Daimo.`,
      tryAgainButton: () => `Intente de nuevo`,
      generateButton: () => `Generar`,
    },
  },

  // ------------ RECEIVE ------------
  // ReceiveNavScreen.tsx
  receiveNav: {
    screenHeader: () => `Solicitud`,
  },
  // ReceiveScreen.tsx
  receive: {
    screenHeader: () => `Solicitud de`,
    sendRequest: {
      loading: () => `Solicitando...`,
      title: () => `Envíe una solicitud`,
      subtitle: () =>
        `Solicite USDC a alguien usando cualquier app de mensajería`,
    },
  },

  // ------------ SEND ------------
  // FulfillRequestButton.tsx
  fulfillRequest: {
    disabledReason: {
      fulfilled: () => `Solicitud ya satisfecha`,
      cancelled: () => `Solicitud cancelada`,
      self: () => `Ne puedes enviarte a ti mismo`,
      insufficientFunds: () => `Fondos insuficientes`,
    },
    holdButton: () => `MANTENGA PARA CONFIRMAR`,
    statusMsg: {
      paymentsPublic: () => `Pagos son públicos`,
      totalDollars: (dollars: string) => `Tasas totales incl. ${dollars}`,
    },
  },
  // MemoDisplay.tsx
  memoDisplay: {
    status: (status: string) => `aviso ${status}`,
    placeholder: () => `PARA QUÉ?`,
  },
  // NoteAction.tsx
  noteAction: {
    disabledReason: {
      insufficientFunds: () => `Fondos insuficientes`,
    },
    statusMsg: {
      totalDollars: (dollars: string) => `Tasas totales incl. ${dollars}`,
    },
    externalAction: {
      sms: () => `ENVIAR SMS`,
      email: () => `ENVIAR MAIL`,
      paymentLink: () => `ENVIAR LINK DE PAGO`,
    },
    holdButton: () => `MANTENGA PARA CONFIRMAR`,
  },
  // RouteDisplay.tsx
  routeDisplay: {
    theyWillReceive: (amount: string, tokenSymbol: string, chainName: string) =>
      `Recibirán ${amount} ${tokenSymbol} en ${chainName}`,
  },
  // SendNavScreen.tsx
  sendNav: {
    screenHeader: () => `Enviar`,
  },
  // SendNoteScreen.tsx
  sendNote: {
    screenHeader: () => `Enviar Link`,
    info: ({ tokenSymbol }: { tokenSymbol: string }) => `Enviar ${tokenSymbol}`,
    help: {
      title: () => `Como los Links de Pago Funcionan`,
      learn: () => `Aprende cómo`,
      subtitle: () => `cualquiera con el link puede reclamarlo`,
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
    enterAmount: () => `Introduza cantidad`,
    createLinkButton: () => `Cree Link de Pago`,
  },
  // SendTransferButton.tsx
  sendTransferButton: {
    disabledReason: {
      insufficientFunds: () => `Fondos Insuficientes`,
      self: () => `No puede enviarse a sí mismo`,
      other: () => `No puede enviar a esta cuenta`,
      zero: () => `Introduzca cantidad`,
      min: (minTransferAmount: number) =>
        `La cantidad mínima de envío son ${minTransferAmount} USDC`,
    },
    holdButton: () => `HOLD TO SEND`,
    statusMsg: {
      insufficientFundsPlusFee: (totalStr: string) =>
        `Necesitas al menos ${totalStr} para enviar`,
      insufficientFunds: () => `Fondos insuficientes`,
      totalDollars: (totalStr: string) => `Total con tasas ${totalStr}`,
      paymentsPublic: () => `Los pagos son publicos`,
    },
  },
  // SendTransferScreen.tsx
  sendTransferScreen: {
    screenHeader: () => `Enviar a`,
    firstTime: (name: string) => `Primera vez pagando ${name}`,
    memo: () => `Nota`,
    sendAs: () => `Enviar como`,
  },
  contactDisplay: {
    requestedBy: () => `Solicitado por`,
  },
  // LandlineDepositButton.tsx
  landlineDepositButton: {
    holdButton: () => "MANTENGA PARA DEPOSITAR",
    depositStatus: {
      creating: () => "Creando depósito",
      success: () => "Depósito creado",
      failed: () => "Depósito fallido",
    },
  },
  // ------------ MISC SCREENS ------------
  // DepositScreen.tsx
  deposit: {
    screenHeader: () => `Deposite o Retire`,
    go: () => `Ir`,
    continue: () => `Continuar`,
    landline: {
      cta: () => `Conectar con Landline`,
      title: () => `Deposite o retire directamente de un banco americano`,
      optionRowTitle: (timeAgo: string) => `Conectado hace ${timeAgo}`,
      startTransfer: () => `Empezar`,
    },
    binance: {
      cta: () => `Deposite desde Binance`,
      title: () => `Envíe desde el balance de Binance`,
    },
    default: {
      cta: () => `Deposite`,
      title: () => `Envíe a su cartera`,
    },
    loading: () => `cargando...`,
    initiated: {
      title: () => `Deposito iniciado`,
      subtitle: () =>
        `Completar en el navegador, los fondos deberían llegar en unos minutos.`,
    },
    withdraw: {
      cta: () => `Retire`,
      title: () => `Retire a cualquier cartera o exchange`,
    },
    bitrefill: {
      cta: () => `Retire con Bitrefill`,
      title: () => `Compre tarjetas de regalo con USDC`,
      success: () => `éxitoso, esperando confirmación`,
    },
  },
  // errorScreens.tsx
  error: {
    banner: () => `Un error ocurrió`,
  },
  // HomeScreen.tsx
  home: {
    pending: (pendingDollars: string) => `+ $${pendingDollars} PENDIENTE`,
    finishAccountSetUp: () => `Terminar de configurar cuenta`,
    yourBalance: () => `Balance`,
    deposit: () => `Depositar`,
    request: () => `Solicitar`,
    send: () => `Enviar`,
  },
  // InviteScreen.tsx
  invite: {
    screenHeader: () => `Invitar Amigos`,
    more: (moreInvitees: number) => `+${moreInvitees} más`,
    invited: (invited: number) =>
      `Has invitado a ${pluralize(invited, "amigo")}`,
    left: (usesLeft: number) =>
      `${usesLeft} ${pluralize(usesLeft, "invitación")} ${pluralize(
        usesLeft,
        "restantes"
      )}`,
    locked: {
      header: () => `Invita tus amigos y gana USDC!`,
      description: () =>
        `Usa Daimo para desbloquear invitaciones. Incorpore a sus contactos enviando\nun link de Pago.`,
    },
    sendButton: () => `INVITAR`,
    referral: {
      creditForInvite: (bonusSubtitle: string) =>
        `Recibirás crédito por la invitación en su perfil ${bonusSubtitle}`,
      bonusBoth: (bonusDollarsInvitee: number) =>
        `y les enviaremos a ambos $${bonusDollarsInvitee} USDC`,
      bonusInvitee: (bonusDollarsInvitee: number) =>
        `y les enviaremos a ellos $${bonusDollarsInvitee} USDC`,
      bonusInviter: (bonusDollarsInviter: number) =>
        `y te enviaremos $${bonusDollarsInviter} USDC`,
      inviteCode: () => `Código de Invitación`,
      inviteLink: () => `Link de Invitación`,
      share: {
        button: () => `Compartir Link`,
        farcasterButton: () => `COMPARTIR FRAME EN FARCASTER`,
        farcasterMsg: () => `Únete+a+mi+en+Daimo`,
      },
    },
  },
  // LandlineBankTransfer.tsx
  landlineBankTransfer: {
    title: {
      deposit: () => `Depositar desde`,
      withdraw: () => `Retirar a`,
    },
    warning: {
      titleDeposit: () => `Los depósitos son públicos`,
      titleWithdraw: () => `Los retiros son públicos`,
      minimumDeposit: () => `La cantidad mínima para depositar es 1 USD`,
      minimumWithdraw: () => `La cantidad mínima para retirar es 1 USDC`,
    },
    depositStatus: {
      shouldFastFinish: () => `Los fondos llegarán instantáneamente.`,
      txLimit: () =>
        `Este depósito excede el límite máximo de depósito instantáneo ($1000). Los fondos lleguen en 1-3 días hábiles.`,
      monthlyLimit: () =>
        `Este depósito excederá su límite mensual de depósito instantáneo ($5000/mes). Los fondos lleguen en 1-3 días hábiles.`,
      maxDeposit: () => `Depósito máximo`,
    },
    withdrawStatus: {
      standard: () => `Los fondos llegan dentro de 3 días hábiles.`,
      maxWithdrawal: () => `Retiro máximo`,
    },
  },
  // ProfileScreen.tsx
  profile: {
    screenHeader: () => `Perfíl`,
    error: {
      account: {
        title: () => `Cuenta no encontrada`,
        msg: (account: string) => `No se pudo cargar cuenta ${account}`,
      },
      invite: {
        title: () => `Invitación no encontrada`,
        msg: (code: string) => `No se cargó la invitación ${code}`,
      },
    },
    subtitle: {
      invitedBy: () => `Invitado por `,
      joined: (timeAgo: string) => `Se unió hace ${timeAgo}`,
    },
  },
  // QRScreen.tsx
  qr: {
    title: {
      display: () => `Mostrar código QR`,
      scan: () => `Escanea código QR`,
    },
    slider: {
      payMe: () => `RECIBIR`,
      scan: () => `ESCANEAR`,
    },
    copiedAddress: () => `Dirección copiada`,
    depositButton: () => `DEPOSITAR DESDE EXCHANGE ›`,
  },
  // SeedPhraseScreen.tsx
  seedPhrase: {
    title: {
      copy: () => `Copiar frase semilla`,
      verify: () => `Verificar frase semilla`,
    },
    description: () =>
      `Esta frase semilla será añadida a tu account, permitiendote recuperarla incluso si pierde su dispositivo.`,
    button: {
      continue: () => `Continuar`,
      finish: () => `Terminar Configuración`,
    },
    copy: {
      confirm: () => `I've saved this seed phrase securely`,
      clipboard: () => `COPIAR AL PORTAPAPELES`,
    },
    verify: {
      description: () => `Introduzca su frase semilla.`,
    },
  },
  // SettingsScreen.tsx
  settings: {
    screenHeader: () => `Ajustes`,
    showDetails: () => `Mostrar detalles`,
    hideDetails: () => `Esconder detalles`,
    account: {
      connectFarcaster: () => `CONECTAR FARCASTER`,
      viewAccountOnExplorer: () => `VER CUENTA EN EXPLORADOR`,
      noSocialsConnected: () => `NINGUNA RED SOCIAL\nCONECTADA`,
    },
    devices: {
      title: () => `Mis dispositivos y respaldos`,
      thisDevice: () => `ESTE DISPOSITIVO`,
      passkeys: {
        title: () => `Qué es el respaldo llave de acceso?`,
        description: {
          firstPara: () =>
            `Las llaves de acceso son una alternativa conveniente y anti-phising para frases semillas`,
          secondPara: () =>
            `Las llaves de acceso son generadas y guardadas en tu llavero de iCloud, y te permite recuperar tu cuenta incluso si pierde su dispositivo.`,
        },
      },
      createBackup: {
        title: () => `Crear un Respaldo`,
        msg: () => `Llave de acceso, clave de seguridad, o frase semilla`,
        button: () => `CREAR RESPALDO`,
      },
      addDevice: {
        title: () => `Añadir un Dispositivo`,
        msg: () => `Usa tu cuenta en otro dispositivo`,
        button: () => `AÑADIR DISPOSITIVO`,
      },
      contactSupport: {
        title: () => `¿Preguntas? ¿Sugerencias?`,
        msg: () => `Contáctanos en Telegram`,
        button: () => `CONTACTAR SOPORTE`,
      },
    },
    logOut: () => `Cerrar sesión`,
    delete: () => `Eliminar cuenta`,
    remove: () => `Eliminar`,
    pending: () => `Pendiente`,
    addedAgo: (timeAgo: string) => `Añadida ${timeAgo}`,
    details: {
      title: () => `Detalles del dispositivo`,
      enableNotifications: () => `Habilitar notificaciones`,
      sendDebugLog: () => `Enviar log`,
    },
  },
  // YourInvitesScreen.tsx
  yourInvites: {
    screenHeader: () => `Tus Invitaciones`,
    joinedAgo: (timeAgo: string) => `Se unió hace ${timeAgo}`,
  },

  // -------------------------- SHARED --------------------------
  // AmountInput.tsx
  amountInput: {
    dollarsAvailable: (dollars: string) => `${dollars} disponibles`,
  },
  // OfflineHeader.tsx
  offlineHeader: {
    header: () => `Desconectado`,
    retrying: () => `Reintentando...`,
  },
  // Scanner.tsx
  scanner: {
    enableCamera: () => `Habilita aceso a la cámara`,
  },
  // SearchHeader.tsx
  searchHeader: {
    searchUser: () => `Busca un usuario...`,
  },
  // SearchResults.tsx
  searchResults: {
    noResults: () => `Sin resultados`,
    paymentLinkButton: () => `ENVÍA LINK PAGO EN SU LUGAR`,
    sentAgo: (timeAgo: string) => `Enviado ${timeAgo}`,
    receivedAgo: (timeAgo: string) => `Recivido ${timeAgo}`,
    extra: {
      contact: () => `Enviar a contacto`,
      requestLink: () => `Solicitar via link`,
      sendLink: () => `Enviar via link`,
      showQR: () => `Mostrar código QR`,
      scanQR: () => `Escanear código QR`,
    },
  },
  // SearchScreen.tsx
  searchScreen: {
    placeholderWithContact: () => `Busca usuarios, ENS, contacto, o email...`,
    placeholderWithoutContact: () =>
      `Busca usuarios, ENS, email, o teléfono...`,
    cancel: () => `Cancelar`,
  },

  // -------------------------- SHEET --------------------------
  // CreateBackupSheet.tsx
  createBackup: {
    default: {
      header: () => `Crear un respaldo`,
      passkeyTitle: () => `Configurar respaldo con\nllave de acceso`,
      passkeyBullet1: () => `Conveniente, seguro, y resistente a phishing`,
      passkeyBullet2: () =>
        `Guardado por tu llavero de contraseñas, como iCloud o 1Password`,
      offlineInsteadButton: () => `Respaldar offline`,
    },
    offline: {
      header: () => `Crear un respaldo offline`,
      securityKeyTitle: () => `Configurar un respaldo de la clave de seguridad`,
      securityKeyBullet1: () => `Usa una llave física FIDO, como YubiKey`,
      seedPhraseTitle: () => `Configurar frase semilla`,
      seedPhraseBullet1: () =>
        `Tus fondos están conectados a una frase que puedes almacenar de forma segura`,
      seedPhraseButton: () => `Respaldar con frase semilla`,
    },
    addKey: {
      passkey: () => `LLAVE DE ACCESO`,
      securityKey: () => `CLAVE DE SEG.`,
      button: (slotType: string) => `RESPALDO CON ${slotType}`,
    },
    recommended: {
      compact: () => `REC.`,
      default: () => `RECOMENDADO`,
    },
  },
  // DebugBottomSheet.tsx
  debugBottom: {
    sheetHeader: () => `Algo salió mal?`,
    description: () =>
      `Contáctanos por Telegram, luego haz click en Enviar Log para enviarnos más información. Llegaremos al fondo del asunto.`,
    helpButton: () => `CONTACTAR SOPORTE`,
  },
  // DepositAddressBottomSheet.tsx
  depositAddressBottom: {
    sheetHeader: () => `Depositar`,
    description: (tokenSymbol: string) =>
      `Envíe ${tokenSymbol} a su dirección debajo. Cualquier otro token ERC-20 será convertido a USDC. Confirme que esté enviando:`,
    checkChain: {
      on: () => `En`,
      notOther: () => `, y no otra cadena`,
    },
    copied: () => `Copiado`,
  },
  // FarcasterBottomSheet.tsx
  farcasterBottom: {
    verified: () => `Tu cuenta está verificada`,
    linked: () => `Tu cuenta está conectada`,
    connect: () => `Conectar Farcaster`,
    openWarpcastButton: () => `ABRIR EN WARPCAST`,
    welcome: (fcUsername: string) => `Bienvenido, ${fcUsername}`,
    loading: () => `Cargando...`,
    removeFromProfile: () => `QUITAR DEL PERFIL`,
    addToProfile: () => `AÑADIR AL PERFIL`,
  },
  // HelpBottomSheet.tsx
  helpBottom: {
    gotItButton: () => `CAPTADO`,
  },
  // OnboardingChecklistBottomSheet.tsx
  onboardingChecklistBottom: {
    sheetHeader: () => `Incorporando lista de requisitos`,
    description: () =>
      `Completa estas acciones para acabar de configurar tu cuenta`,
    secureAccount: {
      title: () => `Asegura tu cuenta`,
      description: () => `Configurar un respaldo`,
    },
    connectFarcaster: {
      title: () => `Conectar Farcaster`,
      description: () => `Importar foto de perfil y conexiones`,
    },
    dismissButton: () => `DESCARTAR`,
  },
  // OwnRequestBottomSheet.tsx
  ownRequestBottom: {
    sheetHeader: () => `Tu solicitaste`,
    cancelButton: () => `CANCELAR SOLICITUD`,
  },
  // SwapBottomSheet.tsx
  swapBottom: {
    sheetHeader: () => `Aceptar`,
    acceptButton: () => `ACEPTAR`,
  },
  // WithdrawInstructionsBottomSheet.tsx
  withdrawInstructionsBottom: {
    sheetHeader: () => `Retirar`,
    wallet: {
      title: () => `Retirar a otra cartera`,
      description: () =>
        `Haga click, y copie su dirección de cartera. Recuerde que está enviando USDC con Base.`,
    },
    coinbase: {
      title: () => `Retirar a Coinbase`,
      description: () => `Ve a Coinbase, y haga click `,
      steps: {
        sendReceive: () => `Enviar y Recivir`,
        receive: () => `Recivir`,
        choose: () => `Elije`,
        setNetwork: () => `Cambia la red a`,
      },
      sendToAddress: () =>
        `Usa Daimo para enviar a la dirección mostrada. Los fondos deberían aparecer en Coinbase en unos minutos.`,
    },
  },

  // -------------------------- MISC --------------------------
  tabNav: {
    deposit: () => `Depositar`,
    invite: () => `Invitar`,
    home: () => `Inicio`,
    send: () => `Enviar`,
    settings: () => `Ajustes`,
  },

  // view/sheet/ components
  sheets: {
    withdraw: () => `Retirar`,
    deposit: () => `Depositar`,
  },

  // view/shared components
  viewShared: {
    recents: () => `Recientes`,
    searchResults: () => `Resultados de busqueda`,
  },
};

function pluralize(n: number, noun: string) {
  if (n === 1) return `${n} ${noun}`; // "1 manzana"

  if (noun.slice(-3) === "ión") {
    return `${n} ${noun.slice(0, -3)}iones`; // "2 canciones" o "{n} canciones"
  }

  return `${n} ${noun}s`; // "2 manzanas" o "{n} manzanas"
}
