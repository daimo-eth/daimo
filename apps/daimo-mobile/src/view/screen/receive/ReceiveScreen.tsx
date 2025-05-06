import {
  dollarsToAmount,
  encodeRequestId,
  generateRequestId,
  getFullMemo,
  MoneyEntry,
  zeroUSDEntry,
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
import { i18n } from "../../../i18n";
import { getAccountManager } from "../../../logic/accountManager";
import { DaimoContact } from "../../../logic/daimoContacts";
import {
  ExternalAction,
  getComposeExternalAction,
  shareURL,
} from "../../../logic/externalAction";
import { getRpcFunc, getRpcHook } from "../../../logic/trpc";
import { Account } from "../../../storage/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ContactDisplay } from "../../shared/ContactDisplay";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextLight } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { useTheme } from "../../style/theme";
import { SendMemoButton } from "../send/MemoDisplay";

type Props = NativeStackScreenProps<ParamListHome, "Receive">;
const i18 = i18n.receive;

export function ReceiveScreen({ route }: Props) {
  const Inner = useWithAccount(RequestScreenInner);
  return <Inner {...route.params} />;
}

function RequestScreenInner({
  account,
  fulfiller,
}: {
  account: Account;
  fulfiller?: DaimoContact;
}) {
  const { ss } = useTheme();

  // Nav
  const nav = useNav();
  const goBack = useExitBack();
  const goHome = useExitToHome();

  // Enter amount, autofocus
  const [money, setMoney] = useState(zeroUSDEntry);
  const textInputRef = useRef<TextInput>(null);
  useEffect(() => {
    // Set focus on transitionEnd to avoid stack navigator iOS glitches.
    const unsubscribe = nav.addListener("transitionEnd", () =>
      textInputRef.current?.focus()
    );
    return unsubscribe;
  }, []);

  // Share request link to share sheet or to a specific phone contact
  const [externalAction, setExternalAction] = useState<
    ExternalAction | undefined
  >(undefined);
  useEffect(() => {
    if (!fulfiller) {
      // Share URL
      setExternalAction({ type: "share", exec: shareURL });
    } else if (fulfiller.type === "email" || fulfiller.type === "phoneNumber") {
      // Compose email or SMS, fallback to share sheet
      getComposeExternalAction(fulfiller).then(setExternalAction);
    }
  }, [fulfiller]);

  // Enter optional memo
  const [memo, setMemo] = useState<string | undefined>(undefined);
  const rpcHook = getRpcHook(daimoChainFromId(account.homeChainId));
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  // Send request
  const [as, setAS] = useActStatus("request");
  const sendRequest = async () => {
    textInputRef.current?.blur();
    setAS("loading", i18.sendRequest.loading());

    // Create-request transaction
    const fullMemo = getFullMemo({ memo, money });
    const { txHash, pendingRequestStatus } = await createRequestOnChain(
      account,
      money,
      fulfiller,
      fullMemo
    );
    console.log(`[REQUEST] txHash ${txHash}`);

    // Show pending outbound request optimistically, before tx confirms
    getAccountManager().transform((a) => ({
      ...a,
      notificationRequestStatuses: [
        ...a.notificationRequestStatuses,
        pendingRequestStatus,
      ],
    }));

    // Share action
    if (externalAction) {
      console.log(`[REQUEST] external action ${externalAction.type}`);
      const didShare = await externalAction.exec(pendingRequestStatus.link);
      console.log(`[REQUEST] action ${didShare}`);
    }

    setAS("success");
    nav.navigate("HomeTab", { screen: "Home" });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader title={i18.screenHeader()} onBack={goBack || goHome} />
        <Spacer h={8} />
        {!fulfiller && (
          <InfoBox
            title={i18.sendRequest.title()}
            subtitle={i18.sendRequest.subtitle()}
          />
        )}
        <Spacer h={24} />
        {fulfiller && <ContactDisplay contact={fulfiller} />}
        <Spacer h={32} />
        <AmountChooser
          moneyEntry={money}
          onSetEntry={setMoney}
          showAmountAvailable={false}
          showCurrencyPicker
          innerRef={textInputRef}
          disabled={as.status !== "idle"}
          autoFocus={false}
        />
        <Spacer h={16} />
        <SendMemoButton memo={memo} memoStatus={memoStatus} setMemo={setMemo} />
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
                  title={i18n.shared.buttonAction.cancel()}
                  onPress={goBack || goHome}
                />
              </View>
              <View style={styles.buttonGrow}>
                <ButtonBig
                  type={as.status === "success" ? "success" : "primary"}
                  disabled={money.dollars <= 0 || as.status !== "idle"}
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

async function createRequestOnChain(
  account: Account,
  money: MoneyEntry,
  fulfiller?: DaimoContact,
  memo?: string
) {
  const id = generateRequestId();
  const idString = encodeRequestId(id);
  const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));

  const { txHash, status } = await rpcFunc.createRequestSponsoredV2.mutate({
    recipient: account.address,
    idString,
    amount: `${dollarsToAmount(money.dollars)}`,
    fulfiller: fulfiller?.type === "eAcc" ? fulfiller.addr : undefined,
    memo,
  });

  return { txHash, pendingRequestStatus: status };
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
