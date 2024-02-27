import {
  dollarsToAmount,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useActStatus } from "../../../action/actStatus";
import { env } from "../../../logic/env";
import { Account } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListReceive, useNav } from "../../shared/nav";
import { shareURL } from "../../shared/shareURL";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListReceive, "Receive">;

// Dead code for now
// Will replace RecieveScreen in the next version.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ReceiveScreenV2({ route }: Props) {
  const { autoFocus } = route.params || {};
  const Inner = useWithAccount(RequestScreenInnerV2);
  return <Inner autoFocus={!!autoFocus} />;
}

function RequestScreenInnerV2({
  account,
  autoFocus,
}: {
  account: Account;
  autoFocus: boolean;
}) {
  const [dollars, setDollars] = useState(0);

  // On successful send, go home
  const [as, setAS] = useActStatus("requestv2");

  const nav = useNav();
  const textInputRef = useRef<TextInput>(null);

  const goHome = useCallback(() => {
    setAS("idle");
    setDollars(0);
    nav.reset({ routes: [{ name: "HomeTab", params: { screen: "Home" } }] });
  }, [nav]);

  const rpcFunc = env(daimoChainFromId(account.homeChainId)).rpcFunc;
  const sendRequest = async () => {
    textInputRef.current?.blur();
    setAS("loading", "Requesting...");

    const id = generateRequestId();
    const idString = encodeRequestId(id);

    const txHash = await rpcFunc.createRequestSponsored.mutate({
      recipient: account.address,
      idString,
      amount: `${dollarsToAmount(dollars)}`,
    });

    console.log(`[REQUEST] txHash ${txHash}`);
    setAS("loading", "Sharing...");

    const url = formatDaimoLink({
      type: "requestv2",
      id: idString,
      recipient: account.name,
      dollars: `${dollars}`,
    });

    const didShare = await shareURL(url);
    console.log(`[REQUEST] action ${didShare}`);
    setAS("success");
    nav.navigate("HomeTab", { screen: "Home" });
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
          innerRef={textInputRef}
          disabled={as.status !== "idle"}
        />
        <Spacer h={32} />
        <View style={ss.container.padH16}>
          {as.status === "loading" ? (
            <>
              <ActivityIndicator size="large" />
              <Spacer h={32} />
              <TextCenter>
                <TextLight>{as.message}</TextLight>
              </TextCenter>
            </>
          ) : (
            <ButtonBig
              type={as.status === "success" ? "success" : "primary"}
              disabled={dollars <= 0 || as.status !== "idle"}
              title={as.status === "success" ? "Sent" : "Send Request"}
              onPress={sendRequest}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
