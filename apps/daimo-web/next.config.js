/** @type {import('next').NextConfig} */
const nextConfig = {
  headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "content-type", value: "application/json" }],
      },
    ];
  },
  webpack: (config) => {
    config.externals.push({
      bufferutil: "bufferutil",
      "utf-8-validate": "utf-8-validate",
    });
    return config;
  },
};

module.exports = nextConfig;
