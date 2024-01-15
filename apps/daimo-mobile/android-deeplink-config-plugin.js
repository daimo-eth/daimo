const { withAndroidManifest } = require("@expo/config-plugins");

// Based on https://docs.expo.dev/guides/linking/#common-url-schemes
const withAndroidQueries = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest.queries = [
      {
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.SENDTO" } }],
            data: [{ $: { "android:scheme": "mailto" } }],
          },
          {
            action: [{ $: { "android:name": "android.intent.action.SENDTO" } }],
            data: [{ $: { "android:scheme": "sms" } }],
          },
        ],
      },
    ];

    return config;
  });
};

module.exports = withAndroidQueries;
