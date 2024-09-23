import { dollarsToAmount, MoneyEntry, zeroUSDEntry } from "@daimo/common";
import { baseUSDC, DaimoChain, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { LandlineDepositButton } from "./send/LandlineDepositButton";
import { MemoPellet, SendMemoButton } from "./send/MemoDisplay";
import { SendTransferButton } from "./send/SendTransferButton";
import {
  LandlineTransferNavProp,
  ParamListDeposit,
  ShouldFastFinishResponse,
  useExitToHome,
  useNav,
} from "../../common/nav";
import { i18n } from "../../i18n";
import { useAccount } from "../../logic/accountManager";
import { BankTransferOptions } from "../../logic/bankTransferOptions";
import {
  DaimoContact,
  getContactName,
  LandlineBankAccountContact,
} from "../../logic/daimoContacts";
import { getRpcHook } from "../../logic/trpc";
import { Account } from "../../storage/account";
import { AmountChooser } from "../shared/AmountInput";
import { ButtonBig } from "../shared/Button";
import { ContactDisplay } from "../shared/ContactDisplay";
import { ScreenHeader } from "../shared/ScreenHeader";
import { SegmentSlider } from "../shared/SegmentSlider";
import Spacer from "../shared/Spacer";
import { TextBody, TextCenter, TextH3, TextLight } from "../shared/text";
import { useWithAccount } from "../shared/withAccount";
import { useTheme } from "../style/theme";

const MIN_DOLLARS = 1;
const MAX_DOLLARS_DEPOSIT = 1e3;
const MAX_DOLLARS_WITHDRAW = 1e4;

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
  bankTransferOption,
  depositStatus,
}: LandlineTransferNavProp & { account: Account }) {
  // TODO(andrew): add check that landlineAccount chain is the same as daimoChain
  const daimoChain = daimoChainFromId(account.homeChainId);

  const nav = useNav();
  const { ss } = useTheme();
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
    if (money == null || bankTransferOption === undefined) {
      return (
        <LLChooseAmount
          llAccount={recipient}
          defaultTransferOption={
            bankTransferOption || BankTransferOptions.Deposit
          }
          onCancel={goBack}
          daimoChain={daimoChain}
        />
      );
    } else {
      return (
        <SendConfirm
          {...{
            account,
            recipient,
            memo,
            money,
            bankTransferOption,
            depositStatus,
          }}
        />
      );
    }
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader
          title={getContactName(recipient as DaimoContact)}
          onBack={goBack}
          onExit={goHome}
        />
        <Spacer h={8} />
        {sendDisplay}
      </View>
    </TouchableWithoutFeedback>
  );
}

function BankTransferSegmentSlider({
  selectedTransferOption,
  setSelectedTransferOption,
}: {
  selectedTransferOption: BankTransferOptions;
  setSelectedTransferOption: (option: BankTransferOptions) => void;
}) {
  const bankTransferOptions = Object.values(BankTransferOptions);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <SegmentSlider
        tabs={bankTransferOptions}
        tab={selectedTransferOption}
        setTab={setSelectedTransferOption}
      />
    </View>
  );
}
function LLChooseAmount({
  llAccount,
  daimoChain,
  onCancel,
  defaultTransferOption,
}: {
  llAccount: LandlineBankAccountContact;
  daimoChain: DaimoChain;
  onCancel: () => void;
  defaultTransferOption: BankTransferOptions;
}) {
  const account = useAccount();

  // Deposit or withdrawal?
  const [selectedTransferOption, setSelectedTransferOption] =
    useState<BankTransferOptions>(defaultTransferOption);

  // Select how much
  const [money, setMoney] = useState(zeroUSDEntry);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSegementedControlChange = (selectedOption: BankTransferOptions) => {
    setSelectedTransferOption(selectedOption);
    validateAmount(money, selectedOption);
  };

  const validateAmount = (newMoney: MoneyEntry, tab?: BankTransferOptions) => {
    tab = tab || selectedTransferOption;
    if (
      tab === BankTransferOptions.Deposit &&
      newMoney.dollars >= MAX_DOLLARS_DEPOSIT
    ) {
      setErrorMessage(
        `${i18.depositStatus.maxDeposit()} <$${MAX_DOLLARS_DEPOSIT}`
      );
    } else if (
      tab === BankTransferOptions.Withdraw &&
      newMoney.dollars >= MAX_DOLLARS_WITHDRAW
    ) {
      setErrorMessage(
        `${i18.withdrawStatus.maxWithdrawal()} <$${MAX_DOLLARS_WITHDRAW}`
      );
    } else {
      setErrorMessage(null);
    }
    setMoney(newMoney);
  };

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: {
        recipient: llAccount,
        money,
        memo,
        bankTransferOption: selectedTransferOption,
        depositStatus,
      },
    });

  // Validate memo
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  // Check instant deposit limits
  if (account == null) return null;
  const depositCheck = rpcHook.validateOffchainDeposit.useQuery({
    daimoAddress: account.address,
    amount: dollarsToAmount(money.dollars).toString(),
  });
  const depositStatus = depositCheck.data;

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={llAccount} />
      <Spacer h={24} />
      <BankTransferSegmentSlider
        selectedTransferOption={selectedTransferOption}
        setSelectedTransferOption={onSegementedControlChange}
      />
      <Spacer h={48} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={validateAmount}
        showAmountAvailable={
          selectedTransferOption === BankTransferOptions.Withdraw &&
          errorMessage == null
        }
        showCurrencyPicker={false}
        autoFocus
      />
      {errorMessage && (
        <TextCenter>
          <TextBody>{errorMessage}</TextBody>
        </TextCenter>
      )}
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
              money.dollars < MIN_DOLLARS ||
              errorMessage !== null ||
              (memoStatus && memoStatus !== "ok")
            }
          />
        </View>
      </View>
      <Spacer h={14} />
      <PublicWarning bankTransferOption={selectedTransferOption} />
    </View>
  );
}

function PublicWarning({
  bankTransferOption,
}: {
  bankTransferOption: BankTransferOptions;
}) {
  return (
    <View style={{ flexDirection: "column" }}>
      <TextCenter>
        <TextLight>
          {bankTransferOption === BankTransferOptions.Deposit
            ? i18.warning.titleDeposit()
            : i18.warning.titleWithdraw()}
        </TextLight>
      </TextCenter>
      <Spacer h={4} />
      <TextCenter>
        <TextLight>
          {bankTransferOption === BankTransferOptions.Deposit
            ? i18.warning.minimumDeposit()
            : i18.warning.minimumWithdraw()}
        </TextLight>
      </TextCenter>
    </View>
  );
}

function SendConfirm({
  account,
  recipient,
  money,
  memo,
  bankTransferOption,
  depositStatus,
}: {
  account: Account;
  recipient: LandlineBankAccountContact;
  money: MoneyEntry;
  memo: string | undefined;
  bankTransferOption: BankTransferOptions;
  depositStatus?: ShouldFastFinishResponse;
}) {
  const nav = useNav();
  const { ss } = useTheme();

  const navToInput = () => {
    nav.navigate("DepositTab", {
      screen: "LandlineTransfer",
      params: { recipient },
    });
  };

  const button: ReactNode =
    bankTransferOption === BankTransferOptions.Withdraw ? (
      <SendTransferButton
        account={account}
        memo={memo}
        recipient={recipient}
        money={money}
        // Minimum USDC withdrawal amount specified by bridgexyz
        // https://apidocs.bridge.xyz/docs/liquidation-address
        minTransferAmount={MIN_DOLLARS}
        toCoin={baseUSDC} // TODO: get home coin from account
      />
    ) : (
      <LandlineDepositButton
        account={account}
        recipient={recipient}
        dollars={money.dollars}
        memo={memo}
        minTransferAmount={MIN_DOLLARS}
      />
    );

  return (
    <View>
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={24} />
      <View>
        <TextH3 style={ss.text.center}>
          {bankTransferOption === BankTransferOptions.Deposit
            ? i18.title.deposit()
            : i18.title.withdraw()}{" "}
          {getContactName(recipient)}
        </TextH3>
      </View>
      <Spacer h={48} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={useCallback(() => {}, [])}
        disabled
        showAmountAvailable={false}
        showCurrencyPicker={false}
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
      <TextCenter>
        <TextLight>
          {bankTransferOption === BankTransferOptions.Deposit
            ? getDepositStatusText(depositStatus)
            : i18.withdrawStatus.standard()}
        </TextLight>
      </TextCenter>
      <Spacer h={16} />
      {button}
    </View>
  );
}

function getDepositStatusText(status?: ShouldFastFinishResponse): string {
  if (status == null) {
    return "...";
  } else if (status.shouldFastFinish) {
    return i18.depositStatus.shouldFastFinish();
  } else if (status.reason === "tx-limit") {
    return i18.depositStatus.txLimit();
  } else if (status.reason === "monthly-limit") {
    return i18.depositStatus.monthlyLimit();
  }
  return "";
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
