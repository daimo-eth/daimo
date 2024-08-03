// TODO: extract UI text into this file
export const en = {
  lang: "en",
  meta: {
    title: () => "Daimo",
    description: () => "Stablecoin payments app",
  },
  home: {
    heroH1: () => "Your own bank, on Ethereum.",
    heroH2: () =>
      "Store money using secure hardware on your phone. Yours alone, like cash.",
  },
  callToAction: {
    justCopiedLink: () => "COPIED, REDIRECTING...",
    copyAndInstall: () => "COPY INVITE & INSTALL DAIMO",
    install: () => "INSTALL DAIMO",
    openInApp: () => "ALREADY HAVE IT? OPEN IN APP",
  },
};

export type LangDef = typeof en;
