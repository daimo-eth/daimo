import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Address } from "viem";

import { Recipient } from "../../logic/recipient";

export type HomeStackParamList = {
  Home: undefined;
  Account: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient };
  Receive: undefined;
  Deposit: undefined;
  Note:
    | undefined
    | {
        ephemeralPrivateKey: `0x${string}` | undefined;
        ephemeralOwner: Address | undefined;
      };
  Request: undefined;
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}
