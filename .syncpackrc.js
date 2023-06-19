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
  ],
};
