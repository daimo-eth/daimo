export const es = {
    shared: {
        buttonStatus: {
            success: () => `Éxito`,
            error: () => `Error`,
            retry: () => `Rever`,
            sent: () => `Enviado`,
            request: () => `Pedido`
        },
        buttonAction: {
            confirm: () => `Confirmar`,
            cancel: () => `Cancelar`,
            decline: () => `Rechazar`,
            request: () => `Pedido`,
            send: () => `Enviar`,
            accept: () => `Aceptar`,
            submit: () => `Entregar`
        },
        textPressable: {
            cancel: () => `Cancelar`
        }
    },
    historyList: {
        empty: () => `Aún no hay transacciones`,
        screenHeader: {
            default: () => `Actividad reciente`,
            other: () => `En medio de ti`
        },
        op: {
            cancelledLink: () => `enlace cancelado`,
            pending: () => `Pendiente`
        }
    },
    historyOp: {
        shareLinkAgain: () => `COMPARTIR ENLACE OTRA VEZ`,
        viewReceipt: () => `VER RECIBO`,
        opVerb: {
            createdLink: () => `Enlace creado`,
            acceptedLink: () => `Enlace aceptado`,
            receivedRequest: () => `Solicitud recibida`,
            fulfilledRequest: () => `Solicitud cumplida`,
            cancelledLink: () => `Enlace cancelado`,
            sent: () => `Enviado`,
            received: () => `Recibió`
        },
        whyNoFees: {
            title: () => `Acerca de esta transferencia`,
            description: {
                secondPara: () => `Los rollups heredan las sólidas garantías de seguridad de Ethereum, a un costo menor.`,
                thirdPara: () => `Las transacciones cuestan unos pocos centavos. Daimo patrocinó esta transferencia, haciéndola gratuita.`
            }
        },
        feeText: {
            free: () => `GRATIS`,
            pending: () => `PENDIENTE`
        }
    },
    addDevice: {
        screenHeader: () => `Añadir dispositivo`,
        headerDescription: () => `Vincula un nuevo dispositivo a tu cuenta escaneando su código QR durante la configuración.`,
        scanQR: {
            error: () => `Error al analizar el código QR`,
            scanned: () => `escaneado indefinido`,
            add: () => `Agregar indefinido`
        }
    },
    addKeySlot: {
        userCancelled: () => `Cancelado`
    },
    device: {
        deleted: () => `Dispositivo eliminado`,
        remove: {
            title: () => `Eliminar indefinido\n`,
            msg: () => `¿Estás seguro de que deseas eliminar este dispositivo?`,
            remove: () => `Eliminar indefinido`,
            cancel: () => `Cancelar`
        },
        current: {
            cannotRemove: () => `Este es tu único dispositivo. Transfiera su saldo a otra parte antes de retirarlo.`,
            usingTitle: () => `Estás usando este dispositivo ahora`,
            usingSubtitle: () => `Eliminarlo de esta cuenta cerrará tu sesión`
        }
    },
    note: {
        payment: () => `Enlace de pago`,
        accept: {
            title: () => `Aceptar`,
            link: () => `Aceptar enlace`,
            long: () => `Aceptar este enlace, recibiendo indefinido`,
            loading: () => `Aceptando enlace...`
        },
        accepted: {
            title: () => `Aceptado`,
            link: () => `Enlace aceptado`,
            long: () => `Aceptado por indefinido`
        },
        cancel: {
            title: () => `Cancelar`,
            link: () => `Cancelar enlace`,
            long: () => `Cancelar este enlace, reclamando indefinido`
        },
        cancelled: {
            title: () => `Cancelado`,
            link: () => `Enlace cancelado`,
            longSelf: () => `Cancelaste este enlace de pago`,
            longOther: () => `Cancelado por el remitente`
        },
        pending: {
            long: () => `Enlace de pago no encontrado. ¿Pendiente?`
        },
        gasTooHigh: () => `Gasolina demasiado alta para reclamar`,
        invalid: () => `Enlace de pago no válido`,
        send: {
            self: () => `enviaste`,
            other: () => `enviado indefinido`
        }
    },
    send_note: {
        title: () => `Enviar enlace`,
        help: {
            title: () => `Aprender cómo`,
            subtitle: () => `Cómo funcionan los enlaces de pago`,
            description: {
                firstPara: () => `Los enlaces de pago llevan dinero en un enlace, para que puedas enviárselo a cualquier persona.`,
                secondPara: () => `Puede cancelar un enlace no reclamado para recuperar su dinero.`,
                thirdPara: () => `Son de autocustodia. La clave es parte de la URL.`,
                fourthPara: () => `Cada enlace también funciona como una invitación a Daimo. Además, cualquiera que tenga el enlace puede reclamar con cualquier billetera, como Rainbow o Metamask.`
            }
        },
        create: () => `Crear enlace de pago`
    },
    notifications: {
        screenHeader: () => `Notificaciones`,
        noNotifications: () => `No Notificaciones`
    },
    requestNotification: {
        msgVerb: {
            via: () => `a través de`,
            from: () => `de`,
            for: () => `para`
        },
        requestState: {
            created: {
                self: () => `Solicitaste`,
                other: () => `solicitado`
            },
            request: () => `pedido`,
            fulfilled: {
                self: () => `cumplió tu`,
                other: () => `Cumpliste una solicitud de`
            },
            cancelled: {
                self: () => `Cancelaste tu`,
                other: () => `canceló su solicitud de `
            },
            declined: {
                self: () => `rechazó su solicitud de`,
                other: () => `Rechazaste una solicitud de `
            }
        }
    },
    swapNotification: {
        msg: () => `Aceptar indefinido indefinido de `
    },
    allowNotifs: {
        screenHeader: () => `Notificaciones`,
        allowButton: () => `Permitir notificaciones`,
        skipButton: () => `Saltar`,
        instructions: () => `Sólo se le notificará sobre la actividad en su cuenta.`
    },
    existingChooseAccount: {
        screenHeader: () => `Cargar cuenta`,
        selectAccount: {
            placeholder: () => `Introduzca su nombre de usuario...`,
            description: () => `Elige en qué cuenta estás iniciando sesión.`
        },
        searchResults: {
            empty: () => `No hay resultados`
        }
    },
    existing: {
        screenHeader: () => `Cuenta existente`,
        generatingKeys: () => `Generando claves...`,
        scanQR: () => `Escanee este código QR desde otro dispositivo para agregar este teléfono a una cuenta Daimo existente.`,
        useBackup: () => `Usar copia de seguridad`
    },
    existingSeedPhrase: {
        screenHeader: () => `Iniciar sesión con frase inicial`
    },
    existingUseBackup: {
        screenHeader: () => `Elija una opción de recuperación`,
        description: () => `Inicie sesión con una clave de respaldo. Esto agrega su dispositivo a la cuenta.`,
        logInWithSeedPhrase: () => `INICIAR SESIÓN CON FRASE SEMILLA`
    },
    logIn: {
        button: () => `INICIAR SESIÓN CON undefinido`,
        fromSeed: {
            error: () => `Frase inicial no a cuenta. ¿Remoto?`,
            button: () => `INICIAR SESIÓN CON FRASE SEMILLA`
        }
    },
    missingKey: {
        screenHeader: () => `llave faltante`,
        logOut: () => `CERRAR SESIÓN`,
        keyErrorDesc: {
            noKey: {
                title: () => `¿Teléfono nuevo?`,
                desc: () => `Encontramos su cuenta, pero no encontramos la clave del dispositivo. Las claves en hardware seguro nunca salen de su dispositivo, por lo que no se transfieren cuando adquiere un teléfono nuevo. Cierre sesión y luego inicie sesión con una clave de respaldo.`
            },
            removedKey: {
                title: () => `Dispositivo eliminado`,
                desc: () => `Parece que la clave de este dispositivo se eliminó de tu cuenta. Cierre sesión y luego inicie sesión con una clave de respaldo.`
            },
            unhandledKeyError: {
                title: () => `Error de clave no controlada`,
                desc: () => ``
            }
        }
    },
    onboardingChooseName: {
        screenHeader: () => `Escoge nombre de usuario`,
        instructions: () => `Elija un nombre de usuario que utilizará en Daimo. Su nombre de usuario es público.`,
        picker: {
            title: () => `Elige un nombre de usuario`,
            createButton: () => `CREAR UNA CUENTA`,
            generateRandom: () => `GENERAR ALEATORIO`,
            error: () => `¿desconectado?`,
            taken: () => `lo siento, ese nombre está tomado`,
            available: () => `disponible`
        }
    },
    onboardingEnterInvite: {
        screenHeader: () => `Ingrese el código de invitación`,
        waitlistButton: () => `ÚNETE A LA LISTA DE ESPERA`,
        instructions: () => `Escriba su código de invitación a continuación o pegue un enlace. Únete a la lista de espera si no tienes un código.`,
        inviteCode: {
            title: () => `introduce el código de invitación`,
            button: () => `Entregar`
        }
    },
    onboardingIntro: {
        title: () => `Bienvenido a Daimo`,
        subtitle: () => `Pague o reciba USDC en cualquier lugar`,
        acceptInviteButton: () => `ACEPTAR INVITACIÓN`,
        alreadyHaveAccountButton: () => `¿YA TIENES UNA CUENTA?`,
        rows: {
            selfCustody: {
                title: () => `Tus llaves, tus monedas.`,
                description: () => `USDC en base.`
            },
            help: {
                button: () => `Aprende más`,
                description: () => `¿Cómo funciona el USDC?`
            },
            everywhere: {
                title: () => `Funciona en todas partes`,
                description: () => `Transferencias instantáneas, 24 horas al día, 7 días a la semana, a cualquier contacto`
            },
            onEthereum: {
                title: () => `Se ejecuta en Ethereum`,
                description: () => `Daimo corre en Base, un resumen`
            }
        },
        helpModalUSDC: {
            description: () => `USDC es una moneda digital regulada que siempre se puede canjear 1:1 por dólares estadounidenses.`,
            learnMore: () => `Más información sobre el USDC`,
            here: () => `aquí`
        }
    },
    onboardingSetupKey: {
        screenHeader: () => `Configurar dispositivo`,
        pin: {
            generateDescription: () => `Genere la clave de su dispositivo Daimo. Esta clave se genera y almacena en su dispositivo y asegura el acceso a su cuenta Daimo.`,
            failedDescription: () => `La autenticación falló. ¿Su teléfono tiene configurada una pantalla de bloqueo segura? Necesitará uno para proteger su cuenta Daimo.`,
            tryAgainButton: () => `Intentar otra vez`,
            generateButton: () => `Generar`
        }
    },
    receiveNav: {
        screenHeader: () => `Pedido`
    },
    receive: {
        screenHeader: () => `Solicitud de`,
        sendRequest: {
            loading: () => `Solicitando...`,
            title: () => `Enviar un enlace de solicitud`,
            subtitle: () => `Solicitar USDC a alguien que utilice cualquier aplicación de mensajería`
        }
    },
    fulfillRequest: {
        disabledReason: {
            fulfilled: () => `Solicitud ya cumplida`,
            cancelled: () => `Solicitud cancelada`,
            self: () => `No puedo enviarte a ti mismo`,
            insufficientFunds: () => `Fondos insuficientes`
        },
        holdButton: () => `MANTENER PARA CUMPLIR`,
        statusMsg: {
            paymentsPublic: () => `Los pagos son públicos.`,
            totalDollars: () => `Total incluido. honorarios indefinidos`
        }
    },
    memoDisplay: {
        status: () => `nota indefinida`,
        placeholder: () => `¿PARA QUÉ ES ESTO?`
    },
    noteAction: {
        disabledReason: {
            insufficientFunds: () => `Fondos insuficientes`
        },
        statusMsg: {
            totalDollars: () => `Total incluido. honorarios indefinidos`
        },
        externalAction: {
            sms: () => `ENVIAR SMS`,
            email: () => `ENVIAR CORREO`,
            paymentLink: () => `ENVIAR ENLACE DE PAGO`
        },
        holdButton: () => `MANTENER PARA CONFIRMAR`
    },
    routeDisplay: {
        theyWillReceive: () => `Recibirán undefinido undefinido`
    },
    sendNav: {
        screenHeader: () => `Enviar`
    },
    sendNote: {
        screenHeader: () => `Enviar enlace`,
        info: () => `Enviar indefinido mediante enlace`,
        help: {
            title: () => `Cómo funcionan los enlaces de pago`,
            learn: () => `Aprender cómo`,
            subtitle: () => `Cualquier persona con el enlace puede reclamar.`,
            description: {
                firstPara: () => `Los enlaces de pago llevan dinero en un enlace, para que puedas enviárselo a cualquier persona.`,
                secondPara: () => `Puede cancelar un enlace no reclamado para recuperar su dinero.`,
                thirdPara: () => `Son de autocustodia. La clave es parte de la URL.`,
                fourthPara: () => `Cada enlace también funciona como una invitación a Daimo. Además, cualquiera que tenga el enlace puede reclamar con cualquier billetera, como Rainbow o Metamask.`
            }
        },
        enterAmount: () => `Ingrese la cantidad`,
        createLinkButton: () => `Crear enlace de pago`
    },
    sendTransferButton: {
        disabledReason: {
            insufficientFunds: () => `Fondos insuficientes`,
            self: () => `No puedo enviarte a ti mismo`,
            other: () => `No puedo enviar a esta cuenta`,
            zero: () => `Introduce una cantidad`,
            min: () => `El monto mínimo de transferencia no está definido en USDC`
        },
        holdButton: () => `ESPERA PARA ENVIAR`,
        statusMsg: {
            insufficientFundsPlusFee: () => `Necesitas al menos indefinido para enviar`,
            insufficientFunds: () => `Fondos insuficientes`,
            totalDollars: () => `Total con tarifas indefinidas`,
            paymentsPublic: () => `Los pagos son públicos.`
        }
    },
    sendTransferScreen: {
        screenHeader: () => `Enviar a`,
        firstTime: () => `Primera vez pagando indefinido`
    },
    deposit: {
        screenHeader: () => `Depositar o Retirar`,
        landline: {
            cta: () => `Conéctate con teléfono fijo`,
            title: () => `Deposite o retire directamente de una cuenta bancaria de EE. UU.`,
            optionRowTitle: () => `Conectado hace undefinido`
        },
        binance: {
            cta: () => `Depósito de Binance`,
            title: () => `Enviar desde saldo de Binance`
        },
        default: {
            cta: () => `Deposito a domicilio`,
            title: () => `Enviar a tu dirección`
        },
        loading: () => `cargando...`,
        initiated: {
            title: () => `Depósito iniciado`,
            subtitle: () => `Complete en el navegador y los fondos deberían llegar en unos minutos.`
        },
        withdraw: {
            cta: () => `Retirar`,
            title: () => `Retirar a cualquier billetera o intercambio`
        }
    },
    error: {
        banner: () => `Ocurrió un error`
    },
    home: {
        pending: () => `+ $indefinido PENDIENTE`,
        finishAccountSetUp: () => `Termina de configurar tu cuenta`
    },
    landlineBankTransfer: {
        warning: {
            title: () => `Los retiros son públicos.`,
            minimum: () => `Retiro mínimo de 1 USDC`
        }
    },
    profile: {
        screenHeader: () => `Perfil`,
        error: {
            account: {
                title: () => `Cuenta no encontrada`,
                msg: () => `No se pudo cargar la cuenta indefinida`
            },
            invite: {
                title: () => `Invitación no encontrada`,
                msg: () => `No se pudo cargar la invitación indefinida`
            }
        },
        subtitle: {
            invitedBy: () => `Invitado por `,
            joined: () => `Se unió indefinido`
        }
    },
    qr: {
        title: {
            display: () => `Mostrar código QR`,
            scan: () => `Escanear código QR`
        },
        copiedAddress: () => `Dirección copiada`,
        depositButton: () => `DEPÓSITO DE CAMBIO ›`
    },
    seedPhrase: {
        title: {
            copy: () => `Copiar frase inicial`,
            verify: () => `Verificar frase inicial`
        },
        description: () => `Esta frase inicial se agregará a su cuenta, lo que le permitirá recuperarla incluso si pierde su dispositivo.`,
        button: {
            continue: () => `Continuar`,
            finish: () => `Finalizar la configuración`
        },
        copy: {
            confirm: () => `He guardado esta frase inicial de forma segura`,
            clipboard: () => `COPIAR AL PORTAPAPELES`
        },
        verify: {
            description: () => `Escriba su frase inicial en el cuadro de entrada.`
        }
    },
    settings: {
        screenHeader: () => `Ajustes`,
        showDetails: () => `Mostrar detalles`,
        hideDetails: () => `Ocultar detalles`,
        account: {
            connectFarcaster: () => `CONECTA A FARCASTER`,
            viewAccountOnExplorer: () => `VER CUENTA EN EXPLORER`,
            noSocialsConnected: () => `NO HAY SOCIALES CONECTADOS`
        },
        devices: {
            title: () => `Mis dispositivos y copias de seguridad`,
            thisDevice: () => `ESTE DISPOSITIVO`,
            passkeys: {
                title: () => `¿Qué es una copia de seguridad con clave de acceso?`
            },
            createBackup: {
                title: () => `Crear una copia de seguridad`,
                msg: () => `Clave de acceso, clave de seguridad o frase inicial`,
                button: () => `CREAR COPIA DE SEGURIDAD`
            },
            addDevice: {
                title: () => `Agrega un dispositivo`,
                msg: () => `Usa tu cuenta en otro dispositivo`,
                button: () => `AÑADIR DISPOSITIVO`
            },
            contactSupport: {
                title: () => `¿Preguntas? ¿Comentario?`,
                msg: () => `Contáctanos en Telegram`,
                button: () => `SOPORTE DE CONTACTO`
            }
        },
        logOut: () => `Cerrar sesión`,
        remove: () => `Eliminar`,
        pending: () => `Pendiente`,
        addedAgo: () => `Añadido indefinido`,
        details: {
            title: () => `Detalles del dispositivo`,
            enableNotifications: () => `Permitir notificaciones`,
            sendDebugLog: () => `Enviar registro de depuración`
        }
    },
    yourInvites: {
        screenHeader: () => `Tus invitaciones`,
        joinedAgo: () => `Se unió hace undefinido`
    },
    amountInput: {
        dollarsAvailable: () => `indefinido disponible`
    },
    offlineHeader: {
        header: () => `Desconectado`,
        retrying: () => `Reintentando...`
    },
    scanner: {
        enableCamera: () => `Habilitar el acceso a la cámara`
    },
    searchHeader: {
        searchUser: () => `Buscar usuario...`
    },
    searchResults: {
        noResults: () => `No hay resultados`,
        paymentLinkButton: () => `ENVIAR ENLACE DE PAGO EN SU LUGAR`,
        sentAgo: () => `Enviado indefinido`,
        receivedAgo: () => `Recibido indefinido`,
        extra: {
            contact: () => `Enviar a contacto`,
            requestLink: () => `Solicitar a través del enlace`,
            sendLink: () => `Enviar por enlace`,
            showQR: () => `Mostrar código QR`,
            scanQR: () => `Escanear código QR`
        }
    },
    searchScreen: {
        placeholderWithContact: () => `Buscar usuario, ENS, contacto o correo electrónico...`,
        placeholderWithoutContact: () => `Buscar usuario, ENS, email, o teléfono...`
    },
    createBackup: {
        default: {
            header: () => `Crear una copia de seguridad`,
            passkeyTitle: () => `Configurar una copia de seguridad de la clave de acceso`,
            passkeyBullet1: () => `Conveniente, seguro y resistente al phishing`,
            passkeyBullet2: () => `Almacenado por su administrador de contraseñas, como iCloud Keychain o 1Password`,
            offlineInsteadButton: () => `En su lugar, haz una copia de seguridad sin conexión`
        },
        offline: {
            header: () => `Crear una copia de seguridad sin conexión`,
            securityKeyTitle: () => `Configurar una copia de seguridad de la clave de seguridad`,
            securityKeyBullet1: () => `Utilice una clave FIDO física, como una YubiKey`,
            seedPhraseTitle: () => `Configurar una frase inicial`,
            seedPhraseBullet1: () => `Tus fondos están conectados a una frase que puedes almacenar de forma segura`,
            seedPhraseButton: () => `Copia de seguridad con frase semilla`
        },
        addKey: {
            passkey: () => `LLAVE MAESTRA`,
            securityKey: () => `CLAVE DE SEGURIDAD`,
            button: () => `HACER COPIA DE SEGURIDAD CON indefinido`
        },
        recommended: {
            compact: () => `REC.`,
            default: () => `RECOMENDADO`
        }
    },
    debugBottom: {
        sheetHeader: () => `¿Algo salió mal?`,
        description: () => `Contáctenos en Telegram, luego toque Enviar registro de depuración para enviarnos más información. Llegaremos al fondo del asunto.`,
        helpButton: () => `SOPORTE DE CONTACTO`
    },
    depositAddressBottom: {
        sheetHeader: () => `Depósito`,
        description: () => `Envíe indefinido a su dirección a continuación. Cualquier otro token ERC-20 se convertirá a USDC. Confirma que estás enviando:`,
        checkChain: {
            on: () => `En `,
            notOther: () => `, ninguna otra cadena`
        },
        copied: () => `Copiado`
    },
    farcasterBottom: {
        verified: () => `Tu cuenta está verificada`,
        linked: () => `Tu cuenta está vinculada`,
        connect: () => `Conectar teleyector`,
        openWarpcastButton: () => `ABIERTO EN WARPCAST`,
        welcome: () => `Bienvenido, indefinido`,
        loading: () => `Cargando...`
    },
    helpBottom: {
        gotItButton: () => `ENTIENDO`
    },
    onboardingChecklistBottom: {
        sheetHeader: () => `Lista de verificación de incorporación`,
        description: () => `Complete estos elementos para finalizar la configuración de la cuenta`,
        secureAccount: {
            title: () => `Asegure su cuenta`,
            description: () => `Añade una copia de seguridad a tu cuenta`
        },
        connectFarcaster: {
            title: () => `Conectar teleyector`,
            description: () => `Importar imagen de perfil y conexiones`
        },
        dismissButton: () => `DESPEDIR`
    },
    ownRequestBottom: {
        sheetHeader: () => `Solicitaste`,
        cancelButton: () => `CANCELAR PETICIÓN`
    },
    swapBottom: {
        sheetHeader: () => `Aceptar`
    },
    withdrawInstructionsBottom: {
        sheetHeader: () => `Retirar`,
        wallet: {
            title: () => `Retirar a otra billetera`,
            description: () => `Toca Enviar y luego pega la dirección de tu billetera. Recuerda que estás enviando USDC en Base.`
        },
        coinbase: {
            title: () => `Retirar a Coinbase`,
            description: () => `Vaya a Coinbase, luego toque `,
            steps: {
                sendReceive: () => `Enviar recibir`,
                receive: () => `Recibir`,
                choose: () => `Elegir`,
                setNetwork: () => `Establecer red en`
            },
            sendToAddress: () => `Utilice Daimo para enviar a la dirección que se muestra. Los fondos deberían aparecer en Coinbase en unos minutos.`
        }
    },
    addrLabel: {
        faucet: () => `equipo daimo`,
        paymentLink: () => `enlace de pago`,
        requestLink: () => `solicitar enlace`,
        paymaster: () => `tarifa`,
        uniswapETHPool: () => `intercambiado ETH`
    },
    tabNav: {
        deposit: () => `Depósito`,
        invite: () => `Invitar`,
        home: () => `Hogar`,
        send: () => `Enviar`,
        settings: () => `Ajustes`
    }
}