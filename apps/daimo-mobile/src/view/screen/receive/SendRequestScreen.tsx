import { assert, formatDaimoLink } from "@daimo/common";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Share,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform,
  ShareAction,
} from "react-native";

import { useAccount } from "../../../model/account";
import { ButtonBig } from "../../shared/Button";
import { AmountInput } from "../../shared/Input";
import { useNav } from "../../shared/nav";
import { color } from "../../shared/style";

export default function SendRequestScreen() {
  const [account] = useAccount();
  assert(account != null);
  const [dollars, setDollars] = useState(0);

  // On successful send, show a toast and go home
  const [sent, setSent] = useState(false);
  const nav = useNav();

  const url = useMemo(
    () =>
      formatDaimoLink({
        type: "request",
        recipient: account.address,
        dollars: `${dollars}`,
      }),
    [account.address, dollars]
  );

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
