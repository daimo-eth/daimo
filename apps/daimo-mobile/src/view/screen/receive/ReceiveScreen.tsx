import { dollarsToAmount, formatDaimoLink } from "@daimo/common";
import { MAX_NONCE_ID_SIZE_BITS } from "@daimo/userop";
import { useIsFocused } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

import { Account, useAccount } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ParamListReceive,
  useFocusOnScreenTransitionEnd,
  useNav,
} from "../../shared/nav";
import { shareURL } from "../../shared/shareURL";
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
  const trackRequest = useTrackRequest();

  const isFocused = useIsFocused();
  const nav = useNav();
  const textInputRef = useRef<TextInput>(null);

  const goHome = useCallback(() => {
    nav.navigate("HomeTab", { screen: "Home" });
    // No jank while the screen is swiping away
    setTimeout(() => {
      setStatus("creating");
      setDollars(0);
    }, 400);
  }, [nav]);

  // Work around react-navigation autofocus bug
  useFocusOnScreenTransitionEnd(textInputRef, nav, isFocused, autoFocus);

  const sendRequest = async () => {
    textInputRef.current?.blur();
    setStatus("sending");

    const requestId = generateRequestID();

    const url = formatDaimoLink({
      type: "request",
      recipient: account.name,
      dollars: `${dollars}`,
      requestId,
    });

    const didShare = await shareURL(url);
    console.log(`[REQUEST] action ${didShare}`);

    if (didShare) {
      setStatus("sent");
      trackRequest(requestId, dollars);
      nav.navigate("HomeTab", { screen: "Home" });
    } else {
      setStatus("creating");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Request" onExit={goHome} />
        <Spacer h={8} />
        <InfoBox
          title="Send a request link"
          subtitle="Request USDC from someone using any messaging app"
        />
        <Spacer h={64} />
        <TextCenter>
          <TextLight>Enter amount to request</TextLight>
        </TextCenter>
        <Spacer h={8} />
        <AmountChooser
          dollars={dollars}
          onSetDollars={setDollars}
          showAmountAvailable={false}
          autoFocus={false}
          lagAutoFocus={false}
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
