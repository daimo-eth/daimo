import { assert, zeroUSDEntry } from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { MemoPellet, SendMemoButton } from "./MemoDisplay";
import { NoteActionButton } from "./NoteActionButton";
import { ParamListSend, useExitToHome, useNav } from "../../../common/nav";
import { env } from "../../../env";
import { i18n } from "../../../i18n";
import { useAccount } from "../../../logic/accountManager";
import {
  ExternalAction,
  getComposeExternalAction,
  shareURL,
} from "../../../logic/externalAction";
import { getRpcHook } from "../../../logic/trpc";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig, HelpButton } from "../../shared/Button";
import { ContactDisplay } from "../../shared/ContactDisplay";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import {
  TextBody,
  TextBold,
  TextCenter,
  TextLight,
  TextPara,
} from "../../shared/text";
import { useTheme } from "../../style/theme";

type Props = NativeStackScreenProps<ParamListSend, "SendLink">;
const i18 = i18n.sendNote;

export function SendNoteScreen({ route }: Props) {
  const { ss } = useTheme();
  const { recipient } = route.params || {};

  // Account, home coin, home chain
  const account = useAccount();
  assert(account != null);
  const daimoChain = daimoChainFromId(account.homeChainId);
  const { tokenSymbol } = env(daimoChain).chainConfig;

  // Enter optional memo
  const [memoChosen, setMemoChosen] = useState(false);
  const [memo, setMemo] = useState<string | undefined>(undefined);
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;
  const onEditMemo = useCallback(() => setMemoChosen(false), []);

  // Enter amount
  const [noteMoney, setNoteMoney] = useState(zeroUSDEntry);
  const textInputRef = useRef<TextInput>(null);
  const [amountChosen, setAmountChosen] = useState(false);

  // Click create > confirm screen
  const onTapCreate = useCallback(() => {
    textInputRef.current?.blur();
    setMemo(memo?.trim() || undefined);
    setAmountChosen(true);
    setMemoChosen(true);
  }, [memo]);

  const nav = useNav();
  const goHome = useExitToHome();
  const resetAmount = useCallback(() => {
    setAmountChosen(false);
    setMemoChosen(false);
    setNoteMoney(zeroUSDEntry);
    textInputRef.current?.focus();
  }, []);
  const goBack = useCallback(() => {
    if (amountChosen) resetAmount();
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, amountChosen]);

  // Finally, share link to external messaging app
  const [externalAction, setExternalAction] = useState<ExternalAction>({
    type: "share",
    exec: shareURL,
  });

  useEffect(() => {
    if (!recipient) return;
    getComposeExternalAction(recipient).then(setExternalAction);
  }, [recipient]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader
          title={i18.screenHeader()}
          onBack={goBack}
          onExit={goHome}
        />
        <Spacer h={8} />
        <InfoBox
          icon="link"
          title={
            <View style={{ flexDirection: "row" }}>
              <TextBody>{i18.info({ tokenSymbol })}</TextBody>
              <HelpButton
                helpTitle={i18.help.title()}
                helpContent={<HelpContentPaymentLink />}
                title={i18.help.learn()}
              />
            </View>
          }
          subtitle={i18.help.subtitle()}
        />
        <Spacer h={24} />
        {recipient ? (
          <ContactDisplay contact={recipient} />
        ) : (
          <>
            <TextCenter>
              <TextLight>{i18.enterAmount()}</TextLight>
            </TextCenter>
          </>
        )}
        <Spacer h={24} />
        {!amountChosen && (
          <AmountChooser
            moneyEntry={noteMoney}
            onSetEntry={setNoteMoney}
            showAmountAvailable
            showCurrencyPicker
            autoFocus
            disabled={amountChosen}
            innerRef={textInputRef}
          />
        )}
        {amountChosen && (
          <AmountChooser
            moneyEntry={noteMoney}
            onSetEntry={setNoteMoney}
            disabled
            showAmountAvailable={false}
            showCurrencyPicker
            autoFocus={false}
            onFocus={resetAmount}
          />
        )}
        <Spacer h={16} />
        {!memoChosen && (
          <SendMemoButton
            memo={memo}
            memoStatus={memoStatus}
            setMemo={setMemo}
          />
        )}
        {memoChosen && memo != null && (
          <MemoPellet memo={memo} onClick={onEditMemo} />
        )}

        <Spacer h={24} />
        {(!amountChosen || !memoChosen) && (
          <ButtonBig
            type="primary"
            title={i18.createLinkButton()}
            disabled={!(noteMoney.dollars > 0)}
            onPress={onTapCreate}
          />
        )}
        {amountChosen && memoChosen && (
          <NoteActionButton
            money={noteMoney}
            memo={memo}
            externalAction={externalAction}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function HelpContentPaymentLink() {
  const { ss } = useTheme();
  return (
    <View style={ss.container.padH16}>
      <TextPara>
        <TextBold>{i18.help.description.firstPara()}</TextBold>
      </TextPara>
      <Spacer h={24} />
      <TextPara>{i18.help.description.secondPara()}</TextPara>
      <Spacer h={24} />
      <TextPara>{i18.help.description.thirdPara()}</TextPara>
      <Spacer h={24} />
      <TextPara>{i18.help.description.fourthPara()}</TextPara>
    </View>
  );
}
