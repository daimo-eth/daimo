const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname); // eslint-disable-line no-undef

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Add any additional packages/modules you want to include
  },
  assetExts: [...config.resolver.assetExts, "ttf", "woff", "woff2"], // Include font extensions
  unstable_enablePackageExports: true,
};

module.exports = config;
