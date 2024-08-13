import {
  DAv2Chain,
  DaimoLinkRequest,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  ForeignToken,
  ProposedSwap,
  assert,
  assertNotNull,
  baseUSDC,
  dollarsToAmount,
  getAccountName,
  getDAv2Chain,
  now,
} from "@daimo/common";
import { DaimoChain, daimoChainFromId } from "@daimo/contract";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ReactNode, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { CoinPellet, SendCoinButton } from "./CoinDisplay";
import { FulfillRequestButton } from "./FulfillRequestButton";
import { MemoPellet, SendMemoButton } from "./MemoDisplay";
import { RoutePellet } from "./RouteDisplay";
import { SendTransferButton } from "./SendTransferButton";
import {
  ParamListSend,
  SendNavProp,
  useExitToHome,
  useNav,
} from "../../../common/nav";
import { i18n } from "../../../i18n";
import { getAccountManager } from "../../../logic/accountManager";
import {
  EAccountContact,
  addLastTransferTimes,
  getContactName,
} from "../../../logic/daimoContacts";
import { useFetchLinkStatus } from "../../../logic/linkStatus";
import { MoneyEntry, usdEntry, zeroUSDEntry } from "../../../logic/moneyEntry";
import { getSwapRoute } from "../../../logic/swapRoute";
import { getRpcFunc, getRpcHook } from "../../../logic/trpc";
import { Account } from "../../../storage/account";
import { AmountChooser } from "../../shared/AmountInput";
import { ButtonBig, TextButton } from "../../shared/Button";
import { CenterSpinner } from "../../shared/CenterSpinner";
import { ContactDisplay } from "../../shared/ContactDisplay";
import { InfoBox } from "../../shared/InfoBox";
import { ScreenHeader } from "../../shared/ScreenHeader";
import Spacer from "../../shared/Spacer";
import { ErrorRowCentered } from "../../shared/error";
import { color, ss } from "../../shared/style";
import { TextCenter, TextLight, TextMeta } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";

type Props = NativeStackScreenProps<ParamListSend, "SendTransfer">;
const i18 = i18n.sendTransferScreen;

export default function SendScreen({ route }: Props) {
  console.log(`[SEND] rendering SendScreen ${JSON.stringify(route.params)}}`);
  const Inner = useWithAccount(SendScreenInner);
  return <Inner {...route.params} />;
}

function SendScreenInner({
  link,
  recipient,
  money,
  memo,
  toCoin,
  toChain,
  account,
}: SendNavProp & { account: Account }) {
  assertNotNull(link || recipient, "SendScreenInner: need link or recipient");

  const daimoChain = daimoChainFromId(account.homeChainId);
  const requestFetch = useFetchLinkStatus(link, daimoChain);
  const requestStatus = requestFetch.data as
    | DaimoRequestStatus
    | DaimoRequestV2Status
    | null;

  const nav = useNav();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("SendTab", { screen: "SendTransfer", params });
    if (money != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, money, recipient]);

  const defaultHomeCoin = baseUSDC; // TODO: add homecoin in Account
  const defaultHomeChain = getDAv2Chain(account.homeChainId);
  toCoin = toCoin ?? defaultHomeCoin;
  toChain = toChain ?? getDAv2Chain(account.homeChainId);

  const sendDisplay = (() => {
    if (link) {
      if (requestFetch.isFetching) {
        return <CenterSpinner />;
      } else if (requestFetch.error) {
        return <ErrorRowCentered error={requestFetch.error} />;
      } else if (requestStatus) {
        const recipient = addLastTransferTimes(
          account,
          requestStatus.recipient
        );
        if (requestStatus.link.type === "requestv2") {
          const statusV2 = requestStatus as DaimoRequestV2Status;
          return (
            <SendConfirm
              account={account}
              recipient={recipient}
              memo={memo || statusV2.memo}
              money={usdEntry(requestStatus.link.dollars)}
              toCoin={toCoin}
              toChain={toChain}
              requestStatus={requestStatus as DaimoRequestV2Status}
            />
          );
        } else {
          // Backcompat with old request links
          if (requestStatus.link.dollars == null) {
            return (
              <SendChooseAmount
                recipient={recipient}
                onCancel={goBack}
                daimoChain={daimoChain}
                defaultHomeCoin={(link as DaimoLinkRequest).toCoin ?? toCoin}
                defaultHomeChain={(link as DaimoLinkRequest).toChain ?? toChain}
                account={account}
              />
            );
          } else {
            return (
              <SendConfirm
                account={account}
                recipient={recipient}
                memo={memo}
                money={usdEntry(requestStatus.link.dollars)}
                toCoin={(link as DaimoLinkRequest).toCoin ?? toCoin}
                toChain={(link as DaimoLinkRequest).toChain ?? toChain}
              />
            );
          }
        }
      } else return <CenterSpinner />;
    } else if (recipient) {
      if (money == null)
        return (
          <SendChooseAmount
            recipient={recipient}
            onCancel={goBack}
            daimoChain={daimoChain}
            defaultHomeCoin={defaultHomeCoin}
            defaultHomeChain={defaultHomeChain}
            account={account}
          />
        );
      else
        return (
          <SendConfirm
            {...{ account, recipient, memo, money, toCoin, toChain }}
          />
        );
    } else throw new Error("unreachable");
  })();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={ss.container.screen}>
        <ScreenHeader
          title={i18.screenHeader()}
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
  defaultHomeCoin,
  defaultHomeChain,
  account,
}: {
  recipient: EAccountContact;
  daimoChain: DaimoChain;
  onCancel: () => void;
  defaultHomeCoin: ForeignToken;
  defaultHomeChain: DAv2Chain;
  account: Account;
}) {
  // Select how much
  const [money, setMoney] = useState(zeroUSDEntry);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(undefined);

  // Select what coin (defaults to native home coin, e.g. daimo USDC)
  const [toCoin, setToCoin] = useState<ForeignToken>(defaultHomeCoin);

  // Select what chain (defaults to base)
  const [toChain, setToChain] = useState<DAv2Chain>(defaultHomeChain);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { money, memo, recipient, toCoin, toChain },
    });

  // Warn if paying new account
  let infoBubble = <Spacer h={16} />;
  if (recipient.lastSendTime == null) {
    infoBubble = <InfoBox title={i18.firstTime(getContactName(recipient))} />;
  }
  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  // Validate memo
  const rpcHook = getRpcHook(daimoChain);
  const result = rpcHook.validateMemo.useQuery({ memo });
  const memoStatus = result.data;

  // If sending to another DAv2, will be same chain, same coin
  const sendCoinIsFixed = recipient.name != null;

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
      <ContactDisplay contact={recipient} />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={setMoney}
        toCoin={toCoin}
        showAmountAvailable
        autoFocus
      />
      <Spacer h={16} />
      <View style={styles.detailsRow}>
        <View style={styles.detail}>
          {!sendCoinIsFixed && (
            <TextMeta color={color.gray3}>{i18.memo()}</TextMeta>
          )}
          <SendMemoButton
            memo={memo}
            memoStatus={memoStatus}
            setMemo={setMemo}
          />
        </View>

        {!sendCoinIsFixed && (
          <View style={styles.detail}>
            <TextMeta color={color.gray3}>{i18.sendAs()}</TextMeta>
            <SendCoinButton
              toCoin={toCoin}
              toChain={toChain}
              setCoin={setToCoin}
              setChain={setToChain}
            />
          </View>
        )}
      </View>
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
    <TextCenter>
      <TextLight>
        {i18n.sendTransferButton.statusMsg.paymentsPublic()}
      </TextLight>
    </TextCenter>
  );
}

function SendConfirm({
  account,
  recipient,
  money,
  memo,
  toCoin,
  toChain,
  requestStatus,
}: {
  account: Account;
  recipient: EAccountContact;
  money: MoneyEntry;
  memo: string | undefined;
  toCoin: ForeignToken;
  toChain: DAv2Chain;
  requestStatus?: DaimoRequestV2Status;
}) {
  const isRequest = !!requestStatus;

  // Warn if paying new account
  let infoBubble = <Spacer h={16} />;
  if (recipient.lastSendTime == null) {
    infoBubble = (
      <InfoBox title={`First time paying ${getAccountName(recipient)}`} />
    );
  }

  const nav = useNav();
  const navToInput = () => {
    nav.navigate("SendTab", { screen: "SendTransfer", params: { recipient } });
  };

  const rpcFunc = getRpcFunc(daimoChainFromId(account!.homeChainId));

  // TODO: store homeCoin (foreignToken type) in account in the future
  const homeCoin = baseUSDC;
  const numTokens = dollarsToAmount(money.dollars, homeCoin.decimals);

  // If account's home coin is not the same as the desired send coin, retrieve swap route.
  let route = null as ProposedSwap | null;
  if (homeCoin.token !== toCoin.token && homeCoin.chainId === toChain.chainId) {
    route = getSwapRoute({
      fromToken: homeCoin.token,
      toToken: toCoin.token,
      amountIn: numTokens,
      fromAccount: account,
      toAddress: recipient.addr,
      daimoChainId: account!.homeChainId,
    });
  }

  let button: ReactNode;
  if (isRequest) {
    button = <FulfillRequestButton {...{ account, requestStatus }} />;
  } else {
    const memoParts = [] as string[];
    if (money.currency.currency !== "USD") {
      memoParts.push(`${money.currency.symbol}${money.localUnits}`);
    }
    if (memo != null) {
      memoParts.push(memo);
    }
    button = (
      <SendTransferButton
        account={account}
        memo={memoParts.join(" · ")}
        recipient={recipient}
        dollars={money.dollars}
        toCoin={toCoin}
        toChain={toChain}
        route={route}
      />
    );
  }

  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  const [isDecliningRequest, setIsDecliningRequest] = useState(false);

  const onDecline = async () => {
    assert(requestStatus != null);

    await rpcFunc.declineRequest.mutate({
      requestId: requestStatus.link.id,
      decliner: account.address,
    });

    getAccountManager().transform((acc) => {
      const updatedRequestStatus = {
        ...requestStatus,
        status: DaimoRequestState.Declined,
        updatedAt: now(),
      };
      return {
        ...acc,
        // Replace old request with updated one
        notificationRequestStatuses: acc.notificationRequestStatuses
          .filter((r) => r.link.id !== requestStatus.link.id)
          .concat([updatedRequestStatus]),
      };
    });

    nav.navigate("Home");
  };

  return (
    <View>
      {infoBubble}
      <Spacer h={24} />
      <ContactDisplay
        contact={recipient}
        isRequest={isRequest}
        requestMemo={requestStatus?.link?.memo}
      />
      <Spacer h={hasLinkedAccounts ? 8 : 24} />
      <AmountChooser
        moneyEntry={money}
        onSetEntry={useCallback(() => {}, [])}
        toCoin={toCoin}
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={navToInput}
      />
      <Spacer h={16} />
      <View style={styles.detailsRow}>
        {memo ? (
          <MemoPellet memo={memo} onClick={navToInput} />
        ) : (
          <Spacer h={40} />
        )}
        <CoinPellet toCoin={toCoin} toChain={toChain} onClick={navToInput} />
      </View>
      {route && (
        <RoutePellet
          route={route}
          fromCoin={homeCoin}
          fromAmount={numTokens}
          toCoin={toCoin}
          toChain={toChain}
        />
      )}
      <Spacer h={16} />
      {button}
      {isRequest && (
        <>
          <Spacer h={16} />
          {isDecliningRequest ? (
            <ActivityIndicator size="large" />
          ) : (
            <TextButton
              title={i18n.shared.buttonAction.decline()}
              onPress={async () => {
                setIsDecliningRequest(true);
                await onDecline();
              }}
            />
          )}
        </>
      )}
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
  detailsRow: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  detail: {
    flexDirection: "column",
    gap: 8,
  },
});
