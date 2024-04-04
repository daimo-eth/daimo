import {
  DaimoLinkRequestV2,
  dollarsToAmount,
  encodeRequestId,
  generateRequestId,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useActStatus } from "../../../action/actStatus";
import {
  ParamListHome,
  useExitBack,
  useExitToHome,
  useNav,
} from "../../../common/nav";
import { DaimoContact } from "../../../logic/daimoContacts";
import { env } from "../../../logic/env";
import {
  ExternalAction,
  getComposeExternalAction,
  shareURL,
} from "../../../logic/externalAction";
import { Account } from "../../../model/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ContactDisplay } from "../../shared/ContactDisplay";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListHome, "Receive">;

export function ReceiveScreenV2({ route }: Props) {
  const Inner = useWithAccount(RequestScreenInnerV2);
  return <Inner {...route.params} />;
}

function RequestScreenInnerV2({
  account,
  fulfiller,
}: {
  account: Account;
  fulfiller?: DaimoContact;
}) {
  const [dollars, setDollars] = useState(0);

  // On successful send, go home
  const [as, setAS] = useActStatus("requestv2");

  const nav = useNav();
  const textInputRef = useRef<TextInput>(null);

  const rpcFunc = env(daimoChainFromId(account.homeChainId)).rpcFunc;

  const [externalAction, setExternalAction] = useState<
    ExternalAction | undefined
  >(undefined);

  useEffect(() => {
    if (!fulfiller) {
      // Share URL
      setExternalAction({
        type: "share",
        exec: shareURL,
      });
    } else if (fulfiller.type === "email" || fulfiller.type === "phoneNumber") {
      // Compose email or SMS, fallback to share sheet
      getComposeExternalAction(fulfiller).then(setExternalAction);
    }
  }, [fulfiller]);

  const sendRequest = async () => {
    textInputRef.current?.blur();
    setAS("loading", "Requesting...");

    const id = generateRequestId();
    const idString = encodeRequestId(id);

    const txHash = await rpcFunc.createRequestSponsored.mutate({
      recipient: account.address,
      idString,
      amount: `${dollarsToAmount(dollars)}`,
      fulfiller: fulfiller?.type === "eAcc" ? fulfiller.addr : undefined,
    });

    const link: DaimoLinkRequestV2 = {
      type: "requestv2",
      id: idString,
      recipient: account.name,
      dollars: `${dollars}`,
    };

    console.log(`[REQUEST] txHash ${txHash}`);

    if (externalAction) {
      console.log(`[REQUEST] external action ${externalAction.type}`);
      const didShare = await externalAction.exec(link);

      console.log(`[REQUEST] action ${didShare}`);
    }

    setAS("success");
    nav.navigate("HomeTab", { screen: "Home" });
  };

  const goBack = useExitBack();
  const goHome = useExitToHome();

  useEffect(() => {
    const unsubscribe = nav.addListener("transitionEnd", () => {
      // Set focus on transitionEnd to avoid stack navigator looking
      // glitchy on iOS.
      textInputRef.current?.focus();
    });

    return unsubscribe;
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Request from" onBack={goBack || goHome} />
        <Spacer h={8} />
        {!fulfiller && (
          <InfoBox
            title="Send a request link"
            subtitle="Request USDC from someone using any messaging app"
          />
        )}
        <Spacer h={24} />
        {fulfiller && <ContactDisplay contact={fulfiller} />}
        <Spacer h={32} />
        <AmountChooser
          dollars={dollars}
          onSetDollars={setDollars}
          showAmountAvailable={false}
          innerRef={textInputRef}
          disabled={as.status !== "idle"}
          autoFocus={false}
        />
        <Spacer h={32} />
        <View style={ss.container.padH8}>
          {as.status === "loading" ? (
            <>
              <ActivityIndicator size="large" />
              <Spacer h={32} />
              <TextCenter>
                <TextLight>{as.message}</TextLight>
              </TextCenter>
            </>
          ) : (
            <View style={styles.buttonGroup}>
              <View style={styles.buttonGrow}>
                <ButtonBig
                  type="subtle"
                  title="Cancel"
                  onPress={goBack || goHome}
                />
              </View>
              <View style={styles.buttonGrow}>
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

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  buttonGrow: {
    flex: 1,
  },
});
