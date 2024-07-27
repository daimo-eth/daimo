import { LanguageDefinition } from "./en";

export const es: LanguageDefinition = {
  // RecommendedExchange
  recommendedExchange: {
    bridge: {
      cta: () => "Transferir monedas desde cualquier billetera",
      title: () => "Transferir desde otra cadena",
    },
    coinbase: {
      cta: () => "Depositar desde Coinbase",
      title: () => "Enviar desde Coinbase y otras opciones",
    },
    ramp: {
      cta: () => "Comprar USDC",
      title: () => "Tarjetas, bancos y opciones internacionales",
    },
  },

  // SuggestedActions
  suggestedActions: {
    upgrade: {
      title: () => "Actualización Disponible",
      subtitle: (latestVersion: string) =>
        `Toca para actualizar a ${latestVersion}`,
    },
    backup: {
      title: () => "Asegura Tu Cuenta",
      subtitle: () =>
        "Mantén tu cuenta segura con una copia de seguridad de clave de acceso",
    },
    feedback: {
      title: () => "¿Comentarios? ¿Ideas?",
      subtitle: () => "Únete a nuestro grupo de Telegram.",
    },
  },
};
