import { base, baseUSDC } from "@daimo/common";
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
import { i18n } from "../../i18n";
import { BridgeBankAccountContact } from "../../logic/daimoContacts";
import { MoneyEntry, zeroUSDEntry } from "../../logic/moneyEntry";
import { getRpcHook } from "../../logic/trpc";
import { Account } from "../../storage/account";
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
const i18 = i18n.landlineBankTransfer;

export default function LandlineTransferScreen({ route }: Props) {
  console.log(
    `[SEND] rendering LandlineTransferScreen ${JSON.stringify(route.params)}}`
  );
  const Inner = useWithAccount(LandlineTransferScreenInner);
  return <Inner {...route.params} />;
}

function LandlineTransferScreenInner({
  recipient,
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
    if (money != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, money, recipient]);

  const sendDisplay = (() => {
    if (money == null)
      return (
        <SendChooseAmount
          recipient={recipient}
          onCancel={goBack}
          daimoChain={daimoChain}
        />
      );
    else return <SendConfirm {...{ account, recipient, memo, money }} />;
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader
          title={recipient.bankName}
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
  recipient,
  daimoChain,
  onCancel,
}: {
  recipient: BridgeBankAccountContact;
  daimoChain: DaimoChain;
  onCancel: () => void;
}) {
  // Select how much
  const [money, setMoney] = useState(zeroUSDEntry);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { money, memo, recipient },
    });

  // Validate memo
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={setMoney}
        showAmountAvailable
        autoFocus
      />
      <Spacer h={16} />
      <SendMemoButton memo={memo} memoStatus={memoStatus} setMemo={setMemo} />
      <Spacer h={16} />
      <View style={styles.buttonRow}>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="subtle"
            title={i18n.shared.buttonAction.cancel()}
            onPress={onCancel}
          />
        </View>
        <View style={styles.buttonGrow}>
          <ButtonBig
            type="primary"
            title={i18n.shared.buttonAction.confirm()}
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
    <View style={{ flexDirection: "column" }}>
      <TextCenter>
        <TextLight>{i18.warning.title()}</TextLight>
      </TextCenter>
      <Spacer h={4} />
      <TextCenter>
        <TextLight>{i18.warning.minimum()}</TextLight>
      </TextCenter>
    </View>
  );
}

function SendConfirm({
  account,
  recipient,
  money,
  memo,
}: {
  account: Account;
  recipient: BridgeBankAccountContact;
  money: MoneyEntry;
  memo: string | undefined;
}) {
  const nav = useNav();

  const navToInput = () => {
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { recipient },
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
      // Minimum USDC withdrawal amount specified by bridgexyz
      // https://apidocs.bridge.xyz/docs/liquidation-address
      minTransferAmount={1.0}
      toCoin={baseUSDC} // TODO: get home coin bfrom account
      toChain={base} // TODO: get home chain from account
    />
  );

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={24} />
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
