import { registerRootComponent } from "expo";

// Polyfills for React Native
import "react-native-get-random-values"; // needs to precede ethers

import "@ethersproject/shims";
import "text-encoding-polyfill";

import App from "./src/App";
import { initDebugLog } from "./src/debugLog";

initDebugLog();
registerRootComponent(App);
