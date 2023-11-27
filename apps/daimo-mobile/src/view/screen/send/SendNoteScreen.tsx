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
import { InfoBubble } from "../../shared/InfoBubble";
import { ScreenHeader, useExitToHome } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ParamListSend, useDisableTabSwipe, useNav } from "../../shared/nav";
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
  const goBack = nav.canGoBack() ? nav.goBack : goHome;
  useDisableTabSwipe(nav);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send Link" onBack={goBack} />
        <Spacer h={8} />
        <InfoBubble
          title="Pay by sending a link"
          subtitle="Anyone with the link can claim it"
        />
        <Spacer h={32} />
        <TextCenter>
          <TextLight>Enter amount</TextLight>
        </TextCenter>
        <Spacer h={24} />
        <AmountChooser
          dollars={noteDollars}
          onSetDollars={setNoteDollars}
          showAmountAvailable={!amountChosen}
          autoFocus
          lagAutoFocus={lagAutoFocus}
          disabled={amountChosen}
          innerRef={textInputRef}
        />
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
