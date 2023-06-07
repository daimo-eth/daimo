import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Recipient } from "../../logic/search";

export type HomeStackParamList = {
  Home: undefined;
  User: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient };
  Receive: undefined;
  Deposit: undefined;
  Request: undefined;
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}
