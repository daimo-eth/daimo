import { assert } from "@daimo/common";
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
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ExternalAction,
  getSendRecvLinkAction,
} from "../../shared/composeSend";
import { shareURL } from "../../shared/shareURL";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send Link" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        <InfoBox
          title="Pay by sending a link"
          subtitle="Payment includes Daimo invite"
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
