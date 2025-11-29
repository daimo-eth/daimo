const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "content-type", value: "application/json" }],
      },
      {
        source: "/(.*)",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
  webpack: (config) => {
    if (config.externals !== undefined) {
      config.externals.push({
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
      });
    }
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });
    config.module.rules.push({
      test: /\.tsx?$/,
      loader: "ts-loader",
      exclude: /node_modules/,
    });
    const portoShim = path.resolve(__dirname, "shims/porto-connector.ts");
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@wagmi\/connectors\/dist\/esm\/porto\.js$/,
        portoShim
      ),
      new webpack.NormalModuleReplacementPlugin(
        /@wagmi\/connectors\/dist\/cjs\/porto\.js$/,
        portoShim
      )
    );

    return config;
  },
};

module.exports = nextConfig;
