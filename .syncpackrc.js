// @ts-check
/** @type {import("syncpack").RcFile} */
module.exports = {
  versionGroups: [
    {
      packages: ["@daimo/expo-enclave"],
      dependencies: ["expo", "react", "react-native"],
      pinVersion: "*",
      label: "Peer dependencies of the re-usable enclave module.",
    },
    {
      packages: ["@daimo/*"],
      dependencies: ["@daimo/*"],
      isIgnored: true,
      label: "Monorepo packages.",
    },
    {
      packages: ["*"],
      dependencies: ["@tanstack/react-query"],
      pinVersion: "4.29.25",
    },
  ],
};
