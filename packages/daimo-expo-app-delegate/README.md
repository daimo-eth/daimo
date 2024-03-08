# @daimo/expo-app-delegate

Daimo's custom AppDelegate. This makes Expo iOS apps look nice on Mac Catalyst
by restricting the app window size to a particular fixed size.

More about Swift AppDelegate in Expo: https://docs.expo.dev/modules/appdelegate-subscribers/

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/@daimo/app-delegate.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/@daimo/app-delegate/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install @daimo/expo-app-delegate
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
