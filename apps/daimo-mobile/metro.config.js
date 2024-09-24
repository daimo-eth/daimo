const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname); // eslint-disable-line no-undef

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Add any additional packages/modules you want to include
    stream: require.resolve("stream-browserify"), // For CBOR React Native
  },
  assetExts: [...config.resolver.assetExts, "ttf", "woff", "woff2"], // Include font extensions
};

module.exports = config;
