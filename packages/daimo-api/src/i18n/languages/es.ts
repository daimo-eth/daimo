import { LanguageDefinition } from "./en";

export const es: LanguageDefinition = {
  // RecommendedExchange
  recommendedExchange: {
    bridge: {
      cta: () => "Transfiera monedas desde cualquier billetera",
      title: () => "Transferir desde otra blockchain",
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
    shutdown: {
      title: () => "Aviso de cierre",
      subtitle: () =>
        "Cerramos la app Daimo el 31 de enero de 2026. Por favor retira tus fondos. Toca para más detalles.",
    },
  },
};
