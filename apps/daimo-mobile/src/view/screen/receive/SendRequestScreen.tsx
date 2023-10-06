import { assert, dollarsToAmount, formatDaimoLink } from "@daimo/common";
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Share,
  ShareAction,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { useAccount } from "../../../model/account";
import { AmountInput } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { useNav } from "../../shared/nav";
import { color } from "../../shared/style";

export default function SendRequestScreen() {
  const [account, setAccount] = useAccount();
  assert(account != null);
  const [dollars, setDollars] = useState(0);

  // On successful send, show a toast and go home
  const [sent, setSent] = useState(false);
  const nav = useNav();

  const requestId = generateRequestID();

  const url = useMemo(
    () =>
      formatDaimoLink({
        type: "request",
        recipient: account.name,
        dollars: `${dollars}`,
        requestId,
      }),
    [account.address, dollars]
  );

  const trackRequest = () => {
    account.trackedRequests.push({
      requestId,
      amount: `${dollarsToAmount(dollars)}`,
    });
    setAccount(account);
  };

  const sendRequest = useCallback(async () => {
    try {
      let result: ShareAction;
      if (Platform.OS === "android") {
        result = await Share.share({ message: url });
      } else {
        result = await Share.share({ url }); // Default behavior for iOS
      }

      console.log(`[REQUEST] action ${result.action}`);
      if (result.action === Share.sharedAction) {
        console.log(`[REQUEST] shared, activityType: ${result.activityType}`);
        trackRequest();
        setSent(true);
        setTimeout(() => nav.navigate("Home"), 500);
      } else if (result.action === Share.dismissedAction) {
        // Only on iOS
        console.log(`[REQUEST] share dismissed`);
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, [url]);

  const inputRef = useRef<TextInput>(null);
  const hideKeyboard = useCallback(() => {
    if (inputRef.current == null) return;
    inputRef.current.blur();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={hideKeyboard}>
      <View style={styles.vertOuter}>
        <AmountInput
          dollars={dollars}
          onChange={setDollars}
          innerRef={inputRef}
          autoFocus={!sent}
        />
        <ButtonBig
          type="primary"
          disabled={dollars <= 0 || sent}
          title={sent ? "Sent" : "Send Request"}
          onPress={sendRequest}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

function generateRequestID() {
  const hexRandomString = generatePrivateKey().slice(
    0,
    2 + Number(MAX_NONCE_ID_SIZE_BITS / 4n) // One hex is 4 bits
  ) as Hex; // Uses secure random.
  return `${BigInt(hexRandomString)}` as `${bigint}`;
}

const styles = StyleSheet.create({
  vertOuter: {
    backgroundColor: color.white,
    flex: 1,
    padding: 32,
    paddingTop: 64,
    gap: 64,
    overflow: "hidden",
  },
});
