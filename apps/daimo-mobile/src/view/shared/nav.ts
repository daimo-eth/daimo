import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Recipient } from "../../logic/recipient";

export type HomeStackParamList = {
  Home: undefined;
  Account: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient; amount?: bigint };
  Receive: undefined;
  Deposit: undefined;
  Request: undefined;
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}
