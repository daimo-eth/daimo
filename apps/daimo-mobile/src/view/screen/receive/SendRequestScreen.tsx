import { assert, dollarsToAmount, formatDaimoLink } from "@daimo/common";
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Share,
  ShareAction,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { useAccount } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { useNav } from "../../shared/nav";
import { color } from "../../shared/style";
import { TextBody, TextCenter, TextH2 } from "../../shared/text";

export default function SendRequestScreen() {
  const [account, setAccount] = useAccount();
  assert(account != null);
  const [dollars, setDollars] = useState(0);

  // On successful send, go home
  const [status, setStatus] = useState<"creating" | "sending" | "sent">(
    "creating"
  );
  const nav = useNav();
  const trackRequest = (requestId: `${bigint}`) => {
    account.trackedRequests.push({
      requestId,
      amount: `${dollarsToAmount(dollars)}`,
    });
    setAccount(account);
  };

  const textInputRef = useRef<TextInput>(null);

  const sendRequest = async () => {
    try {
      textInputRef.current?.blur();
      setStatus("sending");

      const requestId = generateRequestID();

      const url = formatDaimoLink({
        type: "request",
        recipient: account.name,
        dollars: `${dollars}`,
        requestId,
      });

      let result: ShareAction;
      if (Platform.OS === "android") {
        result = await Share.share({ message: url });
      } else {
        result = await Share.share({ url }); // Default behavior for iOS
      }

      console.log(`[REQUEST] action ${result.action}`);
      if (result.action === Share.sharedAction) {
        console.log(`[REQUEST] shared, activityType: ${result.activityType}`);
        setStatus("sent");
        trackRequest(requestId);
        nav.navigate("Home");
      } else if (result.action === Share.dismissedAction) {
        // Only on iOS
        console.log(`[REQUEST] share dismissed`);
        setStatus("creating");
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.vertOuter}>
      <AmountChooser
        dollars={dollars}
        onSetDollars={setDollars}
        actionDesc={
          <View>
            <TextCenter>
              <TextBody>Sending</TextBody>
            </TextCenter>
            <TextH2>request link</TextH2>
          </View>
        }
        showAmountAvailable={false}
        innerRef={textInputRef}
        disabled={status !== "creating"}
      />
      <ButtonBig
        type={status === "sent" ? "success" : "primary"}
        disabled={dollars <= 0 || status !== "creating"}
        title={status === "sent" ? "Sent" : "Send Request"}
        onPress={sendRequest}
      />
    </View>
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
    paddingHorizontal: 48,
    flex: 1,
  },
});
