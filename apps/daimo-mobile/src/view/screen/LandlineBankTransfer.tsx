import { LandlineAccount } from "@daimo/api/src/landline/connector";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  LandlineTransferNavProp,
  ParamListDeposit,
  useExitToHome,
  useNav,
} from "../../common/nav";
import { EAccountContact } from "../../logic/daimoContacts";
import { env } from "../../logic/env";
import { Account } from "../../model/account";
import { MoneyEntry, zeroUSDEntry } from "../../model/moneyEntry";
import { MemoPellet, SendMemoButton } from "../screen/send/MemoDisplay";
import { SendTransferButton } from "../screen/send/SendTransferButton";
import { AmountChooser } from "../shared/AmountInput";
import { ButtonBig } from "../shared/Button";
import { ContactDisplay } from "../shared/ContactDisplay";
import { ScreenHeader } from "../shared/ScreenHeader";
import Spacer from "../shared/Spacer";
import { ss } from "../shared/style";
import { TextCenter, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";

type Props = NativeStackScreenProps<ParamListDeposit, "LandlineTransfer">;

export default function LandlineTransferScreen({ route }: Props) {
  console.log(
    `[SEND] rendering LandlineTransferScreen ${JSON.stringify(route.params)}}`
  );
  const Inner = useWithAccount(LandlineTransferScreenInner);
  return <Inner {...route.params} />;
}

function LandlineTransferScreenInner({
  landlineAccount,
  money,
  memo,
  account,
}: LandlineTransferNavProp & { account: Account }) {
  // TODO(andrew): add check that landlineAccount chain is the same as daimoChain
  const daimoChain = daimoChainFromId(account.homeChainId);

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("DepositTab", {
        screen: "LandlineTransfer",
        params,
      });
    if (money != null) goTo({ landlineAccount });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, money, landlineAccount]);

  const sendDisplay = (() => {
    if (money == null)
      return (
        <SendChooseAmount
          landlineAccount={landlineAccount}
          onCancel={goBack}
          daimoChain={daimoChain}
        />
      );
    else return <SendConfirm {...{ account, landlineAccount, memo, money }} />;
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader
          title={landlineAccount.bankName}
          onBack={goBack}
          onExit={goHome}
        />
        <Spacer h={8} />
        {sendDisplay}
      </View>
    </TouchableWithoutFeedback>
  );
}

function SendChooseAmount({
  landlineAccount,
  daimoChain,
  onCancel,
}: {
  landlineAccount: LandlineAccount;
  daimoChain: DaimoChain;
  onCancel: () => void;
}) {
  const recipient: EAccountContact = {
    type: "eAcc",
    addr: landlineAccount.liquidationAddress,
  };

  // Select how much
  const [money, setMoney] = useState(zeroUSDEntry);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { money, memo, landlineAccount },
    });

  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  // Validate memo
  const rpcHook = env(daimoChain).rpcHook;
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={setMoney}
        showAmountAvailable
        autoFocus
      />
      <Spacer h={16} />
      <SendMemoButton
        memo={memo}
        memoStatus={memoStatus}
        setMemo={setMemo}
        daimoChain={daimoChain}
      />
      <Spacer h={16} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig type="subtle" title="CANCEL" onPress={onCancel} />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title="CONFIRM"
            onPress={setSendAmount}
            disabled={
              money.dollars === 0 || (memoStatus && memoStatus !== "ok")
            }
          />
        </View>
      </View>
      <Spacer h={14} />
      <PublicWarning />
    </View>
  );
}

function PublicWarning() {
  return (
    <TextCenter>
      <TextLight>Withdrawals are public</TextLight>
    </TextCenter>
  );
}

function SendConfirm({
  account,
  landlineAccount,
  money,
  memo,
}: {
  account: Account;
  landlineAccount: LandlineAccount;
  money: MoneyEntry;
  memo: string | undefined;
}) {
  const recipient: EAccountContact = {
    type: "eAcc",
    addr: landlineAccount.liquidationAddress,
  };

  const nav = useNav();

  const navToInput = () => {
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { landlineAccount },
    });
  };

  const memoParts = [] as string[];
  if (money.currency.currency !== "USD") {
    memoParts.push(`${money.currency.symbol}${money.localUnits}`);
  }
  if (memo != null) {
    memoParts.push(memo);
  }
  const button: ReactNode = (
    <SendTransferButton
      account={account}
      memo={memoParts.join(" · ")}
      recipient={recipient}
      dollars={money.dollars}
    />
  );

  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={navToInput}
      />
      <Spacer h={16} />
      {memo ? (
        <MemoPellet memo={memo} onClick={navToInput} />
      ) : (
        <Spacer h={40} />
      )}
      <Spacer h={16} />
      {button}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    gap: 18,
    marginHorizontal: 8,
  },
  buttonGrow: {
    flex: 1,
  },
});
