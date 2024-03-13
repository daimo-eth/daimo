import {
  dollarsToAmount,
  encodeRequestId,
  formatDaimoLink,
  generateRequestId,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useActStatus } from "../../../action/actStatus";
import { EAccountContact } from "../../../logic/daimoContacts";
import { env } from "../../../logic/env";
import { Account } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ParamListHome,
  useExitBack,
  useExitToHome,
  useNav,
} from "../../shared/nav";
import { shareURL } from "../../shared/shareURL";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { RecipientDisplay } from "../send/RecipientDisplay";

type Props = NativeStackScreenProps<ParamListHome, "Receive">;

export function ReceiveScreenV2({ route }: Props) {
  const Inner = useWithAccount(RequestScreenInnerV2);
  return <Inner {...route.params} />;
}

function RequestScreenInnerV2({
  account,
  recipient,
}: {
  account: Account;
  recipient?: EAccountContact;
}) {
  const [dollars, setDollars] = useState(0);

  // On successful send, go home
  const [as, setAS] = useActStatus("requestv2");

  const nav = useNav();
  const textInputRef = useRef<TextInput>(null);

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

  const goBack = useExitBack();
  const goHome = useExitToHome();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Request" onBack={goBack || goHome} />
        <Spacer h={8} />
        {!recipient && (
          <InfoBox
            title="Send a request link"
            subtitle="Request USDC from someone using any messaging app"
          />
        )}
        <Spacer h={64} />
        {recipient && <RecipientDisplay recipient={recipient} />}
        <Spacer h={32} />
        <AmountChooser
          dollars={dollars}
          onSetDollars={setDollars}
          showAmountAvailable={false}
          innerRef={textInputRef}
          disabled={as.status !== "idle"}
          autoFocus
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
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <ButtonBig
                  type="subtle"
                  title="Cancel"
                  onPress={goBack || goHome}
                />
              </View>
              <Spacer w={12} />
              <View style={{ flex: 1 }}>
                <ButtonBig
                  type={as.status === "success" ? "success" : "primary"}
                  disabled={dollars <= 0 || as.status !== "idle"}
                  title={as.status === "success" ? "Sent" : "Request"}
                  onPress={sendRequest}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
