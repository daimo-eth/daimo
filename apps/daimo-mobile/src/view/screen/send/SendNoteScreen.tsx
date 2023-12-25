import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SendNoteButton } from "./SendNoteButton";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  ParamListSend,
  useDisableTabSwipe,
  useExitToHome,
  useNav,
} from "../../shared/nav";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "SendLink">;

export function SendNoteScreen({ route }: Props) {
  const { lagAutoFocus } = route.params || {};

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
  useDisableTabSwipe(nav);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send Link" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        <InfoBox
          title="Pay by sending a link"
          subtitle="Anyone with the link can accept it"
        />
        <Spacer h={32} />
        <TextCenter>
          <TextLight>Enter amount</TextLight>
        </TextCenter>
        <Spacer h={24} />
        {!amountChosen && (
          <AmountChooser
            dollars={noteDollars}
            onSetDollars={setNoteDollars}
            showAmountAvailable
            autoFocus
            lagAutoFocus={lagAutoFocus}
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
            lagAutoFocus={false}
            onFocus={resetAmount}
          />
        )}

        <Spacer h={32} />
        {!amountChosen && (
          <ButtonBig
            type="primary"
            title="Create Payment Link"
            disabled={!(noteDollars > 0)}
            onPress={onChooseAmount}
          />
        )}
        {amountChosen && <SendNoteButton dollars={noteDollars} />}
      </View>
    </TouchableWithoutFeedback>
  );
}
