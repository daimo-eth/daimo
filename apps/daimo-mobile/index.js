// Polyfills for React Native
import "react-native-get-random-values"; // needs to precede ethers

import "@ethersproject/shims";
import "text-encoding-polyfill";

import { registerRootComponent } from "expo";
import { enableScreens } from "react-native-screens";

import App from "./src/App";
import { initDebugLog } from "./src/common/debugLog";
import { startSync } from "./src/sync/sync";

// Keep a local debug log. See Send Debug Log in the app.
initDebugLog();

// Sync data from chain. Account balance, transfers, ...
startSync();

// Optimize memory usage and performance with react-native-screens
enableScreens();

registerRootComponent(App);
