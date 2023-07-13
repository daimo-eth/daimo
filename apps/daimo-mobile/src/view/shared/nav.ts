import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Address } from "viem";

import { OpEvent } from "../../model/op";
import { Recipient } from "../../sync/loadRecipients";

export type HomeStackParamList = {
  Home: undefined;
  Account: undefined;
  Chain: undefined;
  Send: undefined | { recipient: Recipient; dollars?: number };
  Withdraw: undefined;
  Request: undefined;
  Deposit: undefined;
  Note:
    | undefined
    | {
        ephemeralPrivateKey: `0x${string}` | undefined;
        ephemeralOwner: Address | undefined;
      };
  RequestSend: undefined;
  History: undefined;
  HistoryOp: { op: OpEvent };
};

export function useNav() {
  return useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
}
