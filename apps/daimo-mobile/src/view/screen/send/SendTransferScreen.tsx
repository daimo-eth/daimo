import {
  DaimoLinkRequest,
  DaimoRequestState,
  DaimoRequestStatus,
  DaimoRequestV2Status,
  assert,
  assertNotNull,
  debugJson,
  dollarsToAmount,
  getAccountName,
  now,
} from "@daimo/common";
import {
  MoneyEntry,
  usdEntry,
  zeroUSDEntry,
} from "@daimo/common/src/moneyEntry";
import {
  DaimoChain,
  ForeignToken,
  daimoChainFromId,
  getTokenByAddress,
} from "@daimo/contract";
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
import { useSwapRoute } from "../../../logic/swapRoute";
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
import { TextCenter, TextLight, TextMeta } from "../../shared/text";
import { useWithAccount } from "../../shared/withAccount";
import { useTheme } from "../../style/theme";

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
  account,
  edit,
}: SendNavProp & { account: Account }) {
  assertNotNull(link || recipient, "SendScreenInner: need link or recipient");

  const daimoChain = daimoChainFromId(account.homeChainId);
  const requestFetch = useFetchLinkStatus(link, daimoChain);
  const requestStatus = requestFetch.data as
    | DaimoRequestStatus
    | DaimoRequestV2Status
    | null;

  const nav = useNav();
  const { ss } = useTheme();
  const goHome = useExitToHome();
  const goBack = useCallback(() => {
    const goTo = (params: Props["route"]["params"]) =>
      nav.navigate("SendTab", { screen: "SendTransfer", params });
    if (money != null) goTo({ recipient });
    else if (nav.canGoBack()) nav.goBack();
    else goHome();
  }, [nav, money, recipient]);

  const { homeChainId, homeCoinAddress } = account;
  const homeCoin = getTokenByAddress(homeChainId, homeCoinAddress);
  toCoin = toCoin ?? homeCoin;

  const sendDisplay = (() => {
    if (link != null) {
      if (requestFetch.isFetching) {
        return <CenterSpinner />;
      } else if (requestFetch.error) {
        return <ErrorRowCentered error={requestFetch.error} />;
      } else if (requestStatus != null) {
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
              homeCoin={homeCoin}
              toCoin={toCoin}
              requestStatus={requestStatus as DaimoRequestV2Status}
            />
          );
        } else {
          if (requestStatus.link.dollars == null) {
            return (
              <SendChooseAmount
                recipient={recipient}
                onCancel={goBack}
                daimoChain={daimoChain}
                defaultMoney={zeroUSDEntry}
                defaultMemo={memo}
                defaultToCoin={(link as DaimoLinkRequest).toCoin}
                edit="money"
              />
            );
          } else {
            return (
              <SendConfirm
                account={account}
                recipient={recipient}
                memo={memo}
                money={usdEntry(requestStatus.link.dollars)}
                homeCoin={homeCoin}
                toCoin={(link as DaimoLinkRequest).toCoin}
              />
            );
          }
        }
      } else return <CenterSpinner />;
    } else if (recipient != null) {
      if (edit != null || money == null) {
        return (
          <SendChooseAmount
            recipient={recipient}
            onCancel={goBack}
            daimoChain={daimoChain}
            defaultMoney={money || zeroUSDEntry}
            defaultMemo={memo}
            defaultToCoin={toCoin || homeCoin}
            edit={edit || "money"}
          />
        );
      } else {
        return (
          <SendConfirm
            {...{ account, recipient, memo, money, homeCoin, toCoin }}
          />
        );
      }
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
  defaultMoney,
  defaultMemo,
  defaultToCoin,
  edit,
}: {
  recipient: EAccountContact;
  daimoChain: DaimoChain;
  onCancel: () => void;
  defaultMoney: MoneyEntry;
  defaultMemo: string | undefined;
  defaultToCoin: ForeignToken;
  edit: "money" | "memo" | "coin";
}) {
  const { color } = useTheme();
  // Select how much
  const [money, setMoney] = useState(defaultMoney);

  // Select what for
  const [memo, setMemo] = useState<string | undefined>(defaultMemo);

  // Select what coin (defaults to native home coin, e.g. daimo USDC)
  const [toCoin, setToCoin] = useState<ForeignToken>(defaultToCoin);

  // Once done, update nav
  const nav = useNav();
  const setSendAmount = () =>
    nav.navigate("SendTab", {
      screen: "SendTransfer",
      params: { money, memo, recipient, toCoin },
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
        showCurrencyPicker
        showAmountAvailable
        autoFocus={edit === "money"}
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
            autoFocus={edit === "memo"}
          />
        </View>

        {!sendCoinIsFixed && (
          <View style={styles.detail}>
            <TextMeta color={color.gray3}>{i18.sendAs()}</TextMeta>
            <SendCoinButton
              toCoin={toCoin}
              setCoin={setToCoin}
              autoFocus={edit === "coin"}
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
  homeCoin,
  toCoin,
  requestStatus,
}: {
  account: Account;
  recipient: EAccountContact;
  money: MoneyEntry;
  memo: string | undefined;
  homeCoin: ForeignToken;
  toCoin: ForeignToken;
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
  const navToInput = (reset: Partial<SendNavProp>) => {
    const params = { recipient, money, memo, toCoin, ...reset };
    console.log(`[SEND] navToInput, params ${debugJson(params)}`);
    nav.navigate("SendTab", { screen: "SendTransfer", params });
  };

  const amountIn = dollarsToAmount(money.dollars, homeCoin.decimals);

  // If account's home coin is not the same as the desired send coin, retrieve swap route.
  const route = useSwapRoute({
    fromAccount: account,
    fromCoin: homeCoin,
    toAddress: recipient.addr,
    toCoin,
    amountIn,
  });

  let button: ReactNode;
  if (isRequest) {
    button = <FulfillRequestButton {...{ account, requestStatus }} />;
  } else {
    button = (
      <SendTransferButton
        account={account}
        memo={memo}
        recipient={recipient}
        money={money}
        toCoin={toCoin}
        route={route}
      />
    );
  }

  const hasLinkedAccounts =
    recipient?.type === "eAcc" && recipient.linkedAccounts?.length;

  const [isDecliningRequest, setIsDecliningRequest] = useState(false);

  const onDecline = async () => {
    assert(requestStatus != null);

    const rpcFunc = getRpcFunc(daimoChainFromId(account.homeChainId));
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
        showCurrencyPicker
        disabled
        showAmountAvailable={false}
        autoFocus={false}
        onFocus={() => navToInput({ money: undefined, edit: "money" })}
      />
      <Spacer h={16} />
      <View style={styles.detailsRow}>
        {memo ? (
          <MemoPellet
            memo={memo}
            onClick={() => navToInput({ edit: "memo" })}
          />
        ) : (
          <Spacer h={40} />
        )}
        <CoinPellet
          toCoin={toCoin}
          onClick={() => navToInput({ edit: "coin" })}
        />
      </View>
      {route && (
        <RoutePellet
          route={route}
          fromCoin={homeCoin}
          fromAmount={amountIn}
          toCoin={toCoin}
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
