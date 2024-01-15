import { assert } from "@daimo/common";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ExternalAction, NoteActionButton } from "./NoteActionButton";
import { RecipientDisplay } from "./RecipientDisplay";
import { useAccount } from "../../../model/account";
import { ExternalRecipient } from "../../../sync/recipients";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig } from "../../shared/Button";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { composeEmail, composeSMS } from "../../shared/composeSend";
import {
  ParamListSend,
  useDisableTabSwipe,
  useExitToHome,
  useNav,
} from "../../shared/nav";
import { shareURL } from "../../shared/shareURL";
import { ss } from "../../shared/style";
import { TextCenter, TextLight } from "../../shared/text";

type Props = NativeStackScreenProps<ParamListSend, "SendLink">;

export function SendNoteScreen({ route }: Props) {
  const { recipient, lagAutoFocus } = route.params || {};

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

  const [account] = useAccount();
  assert(account != null);

  const [externalAction, setExternalAction] = useState<ExternalAction>({
    type: "share",
    exec: shareURL,
  });

  useEffect(() => {
    if (!recipient) return;

    getSendLinkAction(recipient, account.name).then(setExternalAction);
  }, [recipient, noteDollars]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={ss.container.screen}>
        <ScreenHeader title="Send Link" onBack={goBack} onExit={goHome} />
        <Spacer h={8} />
        <InfoBox
          title="Pay by sending a link"
          subtitle="Daimo invite included with money"
        />
        <Spacer h={32} />
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

async function getSendLinkAction(
  recipient: ExternalRecipient,
  senderName: string
): Promise<ExternalAction> {
  const composer =
    recipient.type === "email"
      ? await composeEmail(recipient.email)
      : await composeSMS(recipient.phoneNumber);

  if (!composer) {
    return {
      type: "share",
      exec: shareURL,
    };
  } else {
    return {
      type: recipient.type === "email" ? "mail" : "sms",
      exec: async (url: string, dollars: number) => {
        return composer({
          type: "paymentLink",
          url,
          senderName,
          dollars,
        });
      },
    };
  }
}
