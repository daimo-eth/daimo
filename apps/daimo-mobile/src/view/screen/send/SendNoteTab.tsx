import { useCallback, useRef, useState } from "react";
import { TextInput, View } from "react-native";

import { SendNoteButton } from "./SendNoteButton";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBubble } from "../../shared/InfoBubble";
import Spacer from "../../shared/Spacer";
import { TextCenter, TextLight } from "../../shared/text";

export function SendNoteTab() {
  // Send Payment Link shows available secure messaging apps
  const [noteDollars, setNoteDollars] = useState(0);

  const textInputRef = useRef<TextInput>(null);
  const [amountChosen, setAmountChosen] = useState(false);
  const onChooseAmount = useCallback(() => {
    textInputRef.current?.blur();
    setAmountChosen(true);
  }, []);

  return (
    <View>
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
  );
}
