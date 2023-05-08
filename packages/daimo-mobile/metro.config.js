// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname); // eslint-disable-line no-undef

config.resolver = { ...config.resolver, unstable_enablePackageExports: true };

module.exports = config;
