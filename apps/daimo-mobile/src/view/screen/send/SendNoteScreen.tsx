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

import { MemoPellet, SendMemoButton } from "./MemoDisplay";
import { NoteActionButton } from "./NoteActionButton";
import { ParamListSend, useExitToHome, useNav } from "../../../common/nav";
import { env } from "../../../env";
import { useAccount } from "../../../logic/accountManager";
import {
  ExternalAction,
  getComposeExternalAction,
  shareURL,
} from "../../../logic/externalAction";
import { zeroUSDEntry } from "../../../logic/moneyEntry";
import { getRpcHook } from "../../../logic/trpc";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig, HelpButton } from "../../shared/Button";
import { ContactDisplay } from "../../shared/ContactDisplay";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
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
          <ContactDisplay contact={recipient} />
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
            moneyEntry={noteMoney}
            onSetEntry={setNoteMoney}
            showAmountAvailable
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
            title="Create Payment Link"
            disabled={!(noteMoney.dollars > 0)}
            onPress={onTapCreate}
          />
        )}
        {amountChosen && memoChosen && (
          <NoteActionButton
            dollars={noteMoney.dollars}
            memo={memo}
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
