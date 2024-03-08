// @ts-check
/** @type {import("syncpack").RcFile} */
module.exports = {
  versionGroups: [
    {
      packages: [
        "@daimo/expo-enclave",
        "@daimo/expo-passkeys",
        "@daimo/expo-app-delegate",
      ],
      dependencies: ["expo", "react", "react-native"],
      pinVersion: "*",
      label: "Peer dependencies of the re-usable Expo modules.",
    },
    {
      packages: ["@daimo/*"],
      dependencies: ["@daimo/*"],
      isIgnored: true,
      label: "Monorepo packages.",
    },
  ],
};
