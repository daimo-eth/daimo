import { LangDef, FAQ } from "./en";

// Spanish I18N
export const es: LangDef = {
  lang: "es",
  meta: {
    title: () => "Daimo",
    description: () => "App de pagos stablecoin",
  },

  callToAction: {
    justCopiedLink: () => "COPIADO, REDIRIGIENDO...",
    copyAndInstall: () => "COPIAR INVITACIÓN E INSTALAR",
    install: () => "INSTALAR DAIMO",
    openInApp: () => "¿YA LO TIENES? ABRIR EN LA APP",
  },

  misc: {
    faq: () => "Ayuda",
    blog: () => "Blog",
  },

  download: {
    downloadDaimo: () => "Descargar Daimo",
    iphoneOrIpad: () => "IPHONE O IPAD",
    android: () => "ANDROID",
    orVisit: () => "O visita",
    onYourPhone: () => "en tu teléfono",
    mac: () => "MAC",
    OR: () => "O",
    platforms: {
      ios: {
        title: () => "Descárgalo en la App Store",
      },
      mac: {
        title: () => "Descárgalo en la Mac App Store",
      },
      android: {
        title: () => "Descárgalo en Google Play",
      },
      other: {
        title: () => "Descárgalo en la App Store o Google Play",
      },
    },
  },

  link: {
    actions: {
      requesting: () => `está solicitando`,
      requestingPayment: () => `está solicitando pago`,
      sentYou: () => `te envió`,
      requested: () => `solicitó`,
      requestedPayment: () => `solicitó pago`,
      sent: () => `envió`,
      cancelledSend: () => `canceló el envío`,
      invitedYou: () => "te invitó a Daimo",
      cancelledRequest: () => `canceló la solicitud`,
    },

    errors: {
      unrecognizedLink: () => "Enlace no reconocido",
      loadAccount: () => "No se pudo cargar la cuenta",
      loadStatus: () => "No se pudo cargar el estado de la solicitud",
      loadPayLink: () => "No se pudo cargar el enlace de pago",
    },

    responses: {
      account: {
        desc: () => "Obtén Daimo para enviar o recibir pagos",
      },
      request: {
        desc1: () => "Pagar con Daimo",
        desc2: (name: string) => `Pagado por ${name}`,
      },
      requestsv2: {
        created: () => "Pagar con Daimo",
        canceled: (name: string) => `Cancelado por ${name}`,
        fulfilled: (name: string) => `Pagado por ${name}`,
        default: (err: any) => `unexpected DaimoRequestState ${err}`,
      },
      notev2: {
        confirmed: () => "Aceptar con Daimo",
        claimed: {
          missingReceiver: () => "(receptor faltante)",
          desc: (claim: string) => `Aceptado por ${claim}`,
        },
        cancelled: (name: string) => `Cancelado por ${name}`,
        default: (status: any) => `unexpected DaimoNoteStatus ${status}`,
      },
      invite: {
        expired: () => "Invitación expirada",
        acceptTheInviteBoth: (bonusDollarsInvitee: any) =>
          `Acepta su invitación y te enviaremos a ambos $${bonusDollarsInvitee} USDC`,
        acceptTheInvite: (bonusDollarsInvitee: any) =>
          `Acepta su invitación y te enviaremos $${bonusDollarsInvitee} USDC`,
        getDaimo: () => "Obtén Daimo para enviar o recibir pagos",
      },
    },
  },

  profile: {
    errorNoImage: () => "No se encontró imagen",
  },

  waitlist: {
    signUp: () => "Regístrate en Daimo",
    name: () => "Nombre",
    email: () => "Correo electrónico",
    social: () => "Redes sociales (Twitter, Warpcast, etc)",
    submit: () => "ENVIAR",
    submitting: () => "ENVIANDO",
    submitted: () =>
      `¡Enviado! Nos pondremos en contacto por correo electrónico pronto.`,
    isLimited: () =>
      "Daimo está actualmente en lanzamiento limitado. Regístrate para obtener acceso temprano",
  },

  utils: {
    metaTags: {
      checkStatus: () => "Verificar Estado",
      buttons: {
        openInDaimo: () => "Abrir en Daimo",
        payRequest: () => "Pagar Solicitud",
      },
    },
    linkStatus: {
      // some of these are duplicated in this.link so those we reused
      unhandeledLink: (linkType: any) => `Unhandled link type: ${linkType}`,
      unhandeledLinkForType: (linkType: any) =>
        `Unhandled link status for type: ${linkType}`,
    },

    platform: {
      ios: () => "Descargar en App Store",
      mac: () => "Descargar en Mac App Store",
      android: () => "Obtener en Google Play",
      other: () => "Descargar en App Store o Google Play",
    },
  },

  components: {
    downloadLink: {
      download: () => "Descargar",
    },
    connectWallet: {
      withConnected: () => " CON BILLETERA CONECTADA",
      withAnother: () => " CON OTRA BILLETERA",

      misc: {
        sending: () => "ENVIANDO",
        viewInExplorer: () => "VER EN EXPLORADOR DE BLOQUES",
        wrongNetwork: () => "RED EQUIVOCADA",
        connectedTo: (network: string) => `CONECTADO A ${network}`,
      },

      errors: {
        notEnoughFunds: () => "No hay suficiente USDC en la billetera",
        alreadyClaimed: () => "Ya reclamado",
        alreadyFulfilledOrCancelled: () => "Solicitud ya cumplida o cancelada",
        insufficientEth: () => "ETH insuficiente para el gas de la transacción",
        unexpected: (err: any) =>
          `unexpected DaimoLinkStatus ${err} for wallet action`,
      },
    },
    linkPreview: {
      paidBy: (name: string) => `Pagado por ${name}`,
    },
    invitePreview: {
      bonusForPowerUsers: () => "+$10 BONO PARA USUARIOS AVANZADOS",
      joinNameOn: (name: string) => `Únete a ${name} en`,
    },
  },

  homePage: {
    whyDaimo: {
      features: () => [
        {
          name: "Seguro",
          title: "Tus claves, tus monedas.",
          description: [
            "Sin frase semilla.",
            "Las claves se encuentran en hardware seguro en tu teléfono.",
            "La libertad de la auto-custodia, más fácil que nunca.",
          ],
          imageUrl: "/assets/why-daimo-secure.png",
        },
        {
          name: "Global",
          title: "Funciona en todas partes.",
          description: [
            "Paga y recibe stablecoins a nivel mundial.",
            "Transferencias instantáneas las 24 horas, los 7 días de la semana a cualquiera de tus contactos o a cualquier billetera.",
            "Envía un enlace de solicitud, recibe pagos en la cadena.",
          ],
          imageUrl: "/assets/why-daimo-global.png",
        },
        {
          name: "Multi-cadena",
          title: '¿Qué es "bridging"?',
          description: [
            "Recibe cualquier moneda en cualquier cadena.",
            "Evita puentes lentos y costosos.",
            "Estamos trabajando en una forma de realizar esto... próximamente.",
          ],
          comingSoon: true,
          imageUrl: "/assets/why-daimo-multi-chain.png",
        },
      ],
      texts: {
        whyDaimo: () => "¿Por qué Daimo?",
        text1: () => "Seguro, auditado y el código es completamente abierto.",
        text2: () => "La forma más segura y rápida de utilizar stablecoins.",
        commingSoon: () => "PRÓXIMAMENTE",
      },
    },
    testimonials: {
      text1: () =>
        "Hay aplicaciones que simplemente se sienten bien usar, pero no puedes describir exactamente por qué. Daimo es una de ellas.",
      text2: () => "Kristof Gazso",
      text3: () => "Coautor de ERC-4337, fundador de ",
      text4: () => "Pimlico",
    },
    team: {
      meetTheTeam: () => "Conoce al equipo",
    },
    hero: {
      text1: () => "USD universal, en Ethereum.",
      text2: () =>
        "Almacena dinero utilizando hardware seguro en tu teléfono. Solo tuyo, como dinero en efectivo.",
      text3: () => "Más información",
    },
    faq: {
      text1: () => "Preguntas frecuentes",
      faqs: (): FAQ[] => [
        {
          question: "¿Cómo funcionan las cuentas Daimo?",
          answerHtml:
            "Las cuentas Daimo son cuentas de Ethereum.\n\n" +
            "En el fondo, son un nuevo y mejorado tipo llamado " +
            "cuenta de contrato ERC-4337. Cada dispositivo que agregas a tu cuenta " +
            "almacena una clave secreta. Cuando envías dinero, tu teléfono primero te autentica " +
            "con FaceID o similar, y luego firma criptográficamente la transacción usando esa clave.\n\n" +
            "Daimo auto-custodial. Tus llaves, tus tokens.\n\n" +
            "Daimo ofrece una seguridad más fuerte que las billeteras tradicionales. Las llaves viven en hardware dedicado hecho " +
            "para almacenar secretos, como Secure Enclave en iPhone, y no se pueden extraer de tu dispositivo.\n\n",
        },
        {
          question: "¿Qué stablecoin usa Daimo?",
          answerHtml:
            "Daimo funciona con USDC, una stablecoin de alta calidad emitida por Circle.\n\n" +
            "Las stablecoins son criptomonedas diseñadas para mantener un valor estable. " +
            "Muchas están vinculadas al dólar, por lo que una moneda vale " +
            "$1. Circle es un transmisor de dinero con licencia en EE. UU. asociado " +
            "con Coinbase. USDC es uno de los equivalentes en dólares más grandes y líquidos en web3. " +
            '<a target="_blank" href="https://bluechip.org/coins/usdc" >Más información en Bluechip.</a>\n\n',
        },
        {
          question: "¿En qué blockchain funciona?",
          answerHtml:
            "Daimo utiliza Base, un rollup de Ethereum.\n\n" +
            "Los rollups soportan transacciones casi instantáneas que cuestan " +
            "unos pocos centavos cada una. En contraste, las transacciones en " +
            "Ethereum (capa 1 o L1) tardan aproximadamente 10 veces más y " +
            "cuestan unos pocos dólares cada una. Los rollups logran esto al agrupar muchas " +
            "transacciones en una sola transacción en la L1. Heredan las " +
            "características de Ethereum. Base al igual que L1, es confiable y segura, y funciona " +
            'en todo el mundo. <a target="_blank" href="https://l2beat.com/">Más información en L2Beat.</a>\n\n',
        },
        {
          question:
            "¿Puedo enviar otras monedas como USDT o usar otras blockchains como Polygon?",
          answerHtml:
            "Todavía no. Planeamos soportar pagos con otras stablecoins " +
            "y en otras blockchains pronto.\n\n",
        },
        {
          question: "¿Quién puede ver mis transacciones Daimo?",
          answerHtml:
            "Actualmente, todas las transacciones de Ethereum son generalmente públicas, " +
            "incluidas las transacciones de Daimo. Planeamos agregar pagos privados " +
            "a medida que la infraestructura y el soporte para ellos maduren.",
        },
        {
          question: "¿Daimo es de código abierto?",
          answerHtml:
            "Sí, Daimo es y siempre será de código abierto bajo GPLv3. Estamos aquí para colaborar. " +
            "Queremos hacer que la autocustodia sea rápida, segura y fácil. " +
            '<a target="_blank" href="https://github.com/daimo-eth/daimo">Ver más en nuestro Github.</a>\n',
        },
      ],
    },
  },
};
