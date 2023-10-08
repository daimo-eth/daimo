import { useCallback, useRef, useState } from "react";
import { TextInput, View } from "react-native";

import { SendNoteButton } from "./SendNoteButton";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { ButtonWithStatus } from "../../shared/ButtonWithStatus";
import Spacer from "../../shared/Spacer";
import { TextBody, TextCenter, TextH2 } from "../../shared/text";

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
      <AmountChooser
        dollars={noteDollars}
        onSetDollars={setNoteDollars}
        actionDesc={
          <View>
            <TextCenter>
              <TextBody>Creating</TextBody>
            </TextCenter>
            <TextH2>payment link</TextH2>
          </View>
        }
        showAmountAvailable={!amountChosen}
        disabled={amountChosen}
        innerRef={textInputRef}
      />
      <Spacer h={32} />
      {!amountChosen && (
        <ButtonWithStatus
          button={
            <ButtonBig
              type="primary"
              title="Create Payment Link"
              disabled={!(noteDollars > 0)}
              onPress={onChooseAmount}
            />
          }
          status=""
        />
      )}
      {amountChosen && <SendNoteButton dollars={noteDollars} />}
    </View>
  );
}
