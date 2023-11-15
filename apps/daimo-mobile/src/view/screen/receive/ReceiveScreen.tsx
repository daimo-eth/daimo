import { dollarsToAmount, formatDaimoLink } from "@daimo/common";
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import { ParamListReceive, useNav } from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListReceive, "Receive">;

export default function ReceiveScreen({ route }: Props) {
  const { autoFocus } = route.params || {};
  const Inner = useWithAccount(RequestScreenInner);
  return <Inner autoFocus={!!autoFocus} />;
}

function RequestScreenInner({
  account,
  autoFocus,
}: {
  account: Account;
  autoFocus: boolean;
}) {
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
        <ScreenHeader title="Request" onExit={useExitToHome()} />
        <Spacer h={96} />
        <TextCenter>
          <TextLight>Enter amount to request</TextLight>
        </TextCenter>
        <Spacer h={8} />
        <AmountChooser
          dollars={dollars}
          onSetDollars={setDollars}
          showAmountAvailable={false}
          autoFocus={autoFocus}
          innerRef={textInputRef}
          disabled={status !== "creating"}
        />
        <Spacer h={32} />
        <View style={ss.container.padH16}>
          <ButtonBig
            type={status === "sent" ? "success" : "primary"}
            disabled={dollars <= 0 || status !== "creating"}
            title={status === "sent" ? "Sent" : "Send Request"}
            onPress={sendRequest}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function useTrackRequest() {
  // TODO: use AccountManager. Delayed setAccount can clobber data.
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
