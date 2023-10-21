import { registerRootComponent } from "expo";

// Polyfills for React Native
import "react-native-get-random-values";

import "@ethersproject/shims";
import "text-encoding-polyfill";

import App from "./src/App";
import { initDebugLog } from "./src/debugLog"; // needs to precede ethers

initDebugLog();
registerRootComponent(App);
