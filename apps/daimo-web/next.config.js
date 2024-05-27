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
    return config;
  },
};

module.exports = nextConfig;
