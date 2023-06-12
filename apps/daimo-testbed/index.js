import { registerRootComponent } from "expo";
// Polyfills for React Native
import "@ethersproject/shims";
import "text-encoding-polyfill";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
