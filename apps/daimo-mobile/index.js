import { registerRootComponent } from "expo";

// Polyfills for React Native
import "react-native-get-random-values"; // needs to precede ethers

import "@ethersproject/shims";
import "fast-text-encoding";

import App from "./src/App";
import { initDebugLog } from "./src/debugLog";

initDebugLog();
registerRootComponent(App);
