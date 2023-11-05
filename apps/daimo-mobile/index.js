import { registerRootComponent } from "expo";

// Polyfills for React Native
import "react-native-get-random-values"; // needs to precede ethers

import "@ethersproject/shims";
import "text-encoding-polyfill";

import App from "./src/App";
import { initDebugLog } from "./src/debugLog";
import { startSync } from "./src/sync/sync";

// Keep a local debug log. See Send Debug Log in the app.
initDebugLog();

// Sync data from chain. Account balance, transfers, ...
startSync();

registerRootComponent(App);
