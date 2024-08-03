import { LangDef } from "./en";

// TODO: translate
export const es: LangDef = {
  lang: "es",
  meta: {
    title: () => "Daimo",
    description: () => "App de pagos stablecoin",
  },
  home: {
    heroH1: () => "Tu propio banco, en Ethereum.",
    heroH2: () =>
      "Almacena dinero usando hardware seguro en tu teléfono. Tu propio, como efectivo.",
  },
  callToAction: {
    justCopiedLink: () => "COPIADO, REDIRIGIENDO...",
    copyAndInstall: () => "COPIAR INVITACIÓN E INSTALAR",
    install: () => "INSTALAR DAIMO",
    openInApp: () => "¿YA LO TIENES? ABRIR EN LA APP",
  },
};
