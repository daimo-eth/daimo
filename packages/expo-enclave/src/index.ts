import {
  EventEmitter,
  NativeModulesProxy,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ExpoEnclave.web.ts
// and on native platforms to ExpoEnclave.ts
import { ChangeEventPayload, ExpoEnclaveViewProps } from "./ExpoEnclave.types";
import ExpoEnclaveModule from "./ExpoEnclaveModule";

// Get the native constant value.
export const PI = ExpoEnclaveModule.PI;

export function hello(): string {
  return ExpoEnclaveModule.hello();
}

export async function setValueAsync(value: string) {
  return await ExpoEnclaveModule.setValueAsync(value);
}

const emitter = new EventEmitter(
  ExpoEnclaveModule ?? NativeModulesProxy.ExpoEnclave
);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}

export { ExpoEnclaveViewProps, ChangeEventPayload };
