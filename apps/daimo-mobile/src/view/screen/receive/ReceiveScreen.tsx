import { dollarsToAmount, formatDaimoLink } from "@daimo/common";
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Share,
  ShareAction,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { Account, useAccount } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";
import { withAccount } from "../../shared/withAccount";

export default function ReceiveScreen() {
  const Inner = withAccount(RequestScreenInner);
  return <Inner />;
}

function RequestScreenInner({ account }: { account: Account }) {
  const [dollars, setDollars] = useState(0);

  // On successful send, go home
  const [status, setStatus] = useState<"creating" | "sending" | "sent">(
    "creating"
  );
  const nav = useNav();
  const trackRequest = useTrackRequest();

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
        trackRequest(requestId, dollars);
        nav.navigate("HomeTab", { screen: "Home" });
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send request" onExit={useExitToHome()} />
        <Spacer h={64} />
        <TextCenter>
          <TextLight>Enter amount to request</TextLight>
        </TextCenter>
        <Spacer h={24} />
        <AmountChooser
          dollars={dollars}
          onSetDollars={setDollars}
          showAmountAvailable={false}
          innerRef={textInputRef}
          disabled={status !== "creating"}
        />
        <Spacer h={32} />
        <ButtonBig
          type={status === "sent" ? "success" : "primary"}
          disabled={dollars <= 0 || status !== "creating"}
          title={status === "sent" ? "Sent" : "Send Request"}
          onPress={sendRequest}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

function useTrackRequest() {
  const [account, setAccount] = useAccount();
  return (requestId: `${bigint}`, dollars: number) => {
    if (account == null) return;
    const newAccount = {
      ...account,
      trackedRequests: [
        ...account.trackedRequests,
        {
          requestId,
          amount: `${dollarsToAmount(dollars)}` as `${bigint}`,
        },
      ],
    };
    setAccount(newAccount);
  };
}

function generateRequestID() {
  const hexRandomString = generatePrivateKey().slice(
    0,
    2 + Number(MAX_NONCE_ID_SIZE_BITS / 4n) // One hex is 4 bits
  ) as Hex; // Uses secure random.
  return `${BigInt(hexRandomString)}` as `${bigint}`;
}
