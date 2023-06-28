import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Address } from "viem";

import { Recipient } from "../../logic/recipient";
import { Op } from "../../model/op";

export type HomeStackParamList = {
  Home: undefined;
  Account: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient; dollars?: number };
  Withdraw: undefined;
  Receive: undefined;
  Deposit: undefined;
  Note:
    | undefined
    | {
        ephemeralPrivateKey: `0x${string}` | undefined;
        ephemeralOwner: Address | undefined;
      };
  Request: undefined;
  History: undefined;
  HistoryOp: { op: Op };
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}
