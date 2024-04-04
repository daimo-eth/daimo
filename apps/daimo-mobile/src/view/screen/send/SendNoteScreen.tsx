import { assert } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { NoteActionButton } from "./NoteActionButton";
import { RecipientDisplay } from "./RecipientDisplay";
import { ParamListSend, useExitToHome, useNav } from "../../../common/nav";
import { useAccount } from "../../../logic/accountManager";
import { env } from "../../../logic/env";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig, HelpButton } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ExternalAction,
  getSendRecvLinkAction,
} from "../../shared/composeSend";
import { shareURL } from "../../shared/shareURL";
import { ss } from "../../shared/style";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextLight,
  TextPara,
} from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "SendLink">;

export function SendNoteScreen({ route }: Props) {
  const { recipient } = route.params || {};

  // Send Payment Link shows available secure messaging apps
  const [noteDollars, setNoteDollars] = useState(0);

  const textInputRef = useRef<TextInput>(null);
  const [amountChosen, setAmountChosen] = useState(false);
  const onChooseAmount = useCallback(() => {
    textInputRef.current?.blur();
    setAmountChosen(true);
  }, []);

  const nav = useNav();
  const goHome = useExitToHome();
  const resetAmount = useCallback(() => {
    setAmountChosen(false);
    setNoteDollars(0);
    textInputRef.current?.focus();
  }, []);
  const goBack = useCallback(() => {
    if (amountChosen) resetAmount();
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, amountChosen]);

  const [account] = useAccount();
  assert(account != null);

  const [externalAction, setExternalAction] = useState<ExternalAction>({
    type: "share",
    exec: shareURL,
  });

  useEffect(() => {
    if (!recipient) return;
    getSendRecvLinkAction(recipient, account.name, "send").then(
      setExternalAction
    );
  }, [recipient, noteDollars]);

  // Coin info
  const daimoChain = daimoChainFromId(account.homeChainId);
  const { tokenSymbol } = env(daimoChain).chainConfig;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send Link" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        <InfoBox
          icon="link"
          title={
            <View style={{ flexDirection: "row" }}>
              <TextBody>Send {tokenSymbol} via link </TextBody>
              <HelpButton
                helpTitle="How Payment Links Work"
                helpContent={<HelpContentPaymentLink />}
                title="Learn how"
              />
            </View>
          }
          subtitle="Anyone with the link can claim"
        />
        <Spacer h={24} />
        {recipient ? (
          <RecipientDisplay recipient={recipient} />
        ) : (
          <>
            <TextCenter>
              <TextLight>Enter amount</TextLight>
            </TextCenter>
          </>
        )}
        <Spacer h={24} />
        {!amountChosen && (
          <AmountChooser
            dollars={noteDollars}
            onSetDollars={setNoteDollars}
            showAmountAvailable
            autoFocus
            disabled={amountChosen}
            innerRef={textInputRef}
          />
        )}
        {amountChosen && (
          <AmountChooser
            dollars={noteDollars}
            onSetDollars={setNoteDollars}
            disabled
            showAmountAvailable={false}
            autoFocus={false}
            onFocus={resetAmount}
          />
        )}

        <Spacer h={24} />
        {!amountChosen && (
          <ButtonBig
            type="primary"
            title="Create Payment Link"
            disabled={!(noteDollars > 0)}
            onPress={onChooseAmount}
          />
        )}
        {amountChosen && (
          <NoteActionButton
            dollars={noteDollars}
            externalAction={externalAction}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function HelpContentPaymentLink() {
  return (
    <View style={ss.container.padH16}>
      <TextPara>
        <TextBold>
          Payment links carry money in a link, so that you can send it to
          anyone.
        </TextBold>
      </TextPara>
      <Spacer h={24} />
      <TextPara>
        You can cancel an unclaimed link to get your money back.
      </TextPara>
      <Spacer h={24} />
      <TextPara>They're self-custody. The key is part of the URL.</TextPara>
      <Spacer h={24} />
      <TextPara>
        Each link doubles as a Daimo invite. Plus, anyone with the link can
        claim with any wallet, like Rainbow or Metamask.
      </TextPara>
    </View>
  );
}
