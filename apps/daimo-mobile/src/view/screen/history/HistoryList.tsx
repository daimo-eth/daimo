import {
  AddrLabel,
  TransferClog,
  EAccount,
  OpStatus,
  assert,
  canSendTo,
  getAccountName,
  getDisplayFromTo,
  getSynthesizedMemo,
  now,
  timeAgo,
} from "@daimo/common";
import { daimoChainFromId } from "@daimo/contract";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useContext } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  TouchableHighlight,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAddress } from "viem";

import { SetBottomSheetDetailHeight } from "./HistoryOpScreen";
import { navToAccountPage, useNav } from "../../../common/nav";
import { env } from "../../../env";
import { getI18NLocale, i18n } from "../../../i18n";
import { getCachedEAccount } from "../../../logic/addr";
import { Account } from "../../../storage/account";
import { getAmountText } from "../../shared/Amount";
import { ContactBubble } from "../../shared/Bubble";
import { PendingDot } from "../../shared/PendingDot";
import Spacer from "../../shared/Spacer";
import { color, ss, touchHighlightUnderlay } from "../../shared/style";
import {
  DaimoText,
  TextBody,
  TextCenter,
  TextLight,
  TextMeta,
} from "../../shared/text";

interface HeaderObject {
  isHeader: true;
  id: string;
  month: string;
}
interface transferClogRenderObject {
  isHeader: false;
  id: string;
  op: TransferClog;
}

const i18 = i18n.historyList;

export function HistoryListSwipe({
  account,
  showDate,
  maxToShow,
  otherAcc,
}: {
  account: Account;
  showDate: boolean;
  maxToShow?: number;
  otherAcc?: EAccount;
}) {
  const ins = useSafeAreaInsets();

  // Get relevant transfers in reverse chronological order
  let ops = account.recentTransfers.slice().reverse();
  if (otherAcc != null) {
    const otherAddr = otherAcc.addr;
    ops = ops.filter((op) => {
      const [from, to] = getDisplayFromTo(op);
      return from === otherAddr || to === otherAddr;
    });
  }
  console.log(`[HIST] HistoryListSwipe ${account.name}, ${ops.length} ops`);

  // Link to either the op (zoomed in) or the other account (zoomed out)
  // const linkTo = "op"; // Option to link to AccountPage instead.
  const linkTo = otherAcc == null ? "account" : "op";

  if (ops.length === 0) {
    return (
      <View>
        <Spacer h={16} />
        <TextCenter>
          <TextLight>{i18.empty()}</TextLight>
        </TextCenter>
      </View>
    );
  }

  const renderRow = (t: TransferClog) => (
    <TransferClogRow
      key={getTransferClogId(t)}
      transferClog={t}
      account={account}
      {...{ linkTo, showDate }}
    />
  );

  // Easy case: show a fixed, small preview list
  if (maxToShow != null) {
    const title =
      otherAcc == null ? i18.screenHeader.default() : i18.screenHeader.other();
    return (
      <View style={styles.historyListBody}>
        <HeaderRow key="h0" title={title} />
        {ops.slice(0, maxToShow).map(renderRow)}
        <View style={styles.transferBorder} />
      </View>
    );
  }

  // Full case: show a scrollable, lazy-loaded FlatList
  const stickyIndices = [] as number[];
  const rows: (transferClogRenderObject | HeaderObject)[] = [];

  // Render a HeaderRow for each month, and make it sticky
  let lastMonth = "";
  for (const op of ops) {
    const month = new Date(op.timestamp * 1000).toLocaleString("default", {
      year: "numeric",
      month: "long",
    });
    if (month !== lastMonth) {
      stickyIndices.push(rows.length);
      rows.push({
        isHeader: true,
        month,
        id: month,
      });
      lastMonth = month;
    }
    rows.push({
      isHeader: false,
      id: getTransferClogId(op),
      op,
    });
  }

  return (
    <BottomSheetFlatList
      ListFooterComponent={() => {
        return <Spacer h={ins.bottom + (Platform.OS === "ios" ? 64 : 128)} />;
      }}
      contentContainerStyle={styles.historyListBody}
      data={rows}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => {
        if (item.isHeader) {
          return <HeaderRow key={item.month} title={item.month} />;
        }
        return renderRow(item.op);
      }}
    />
  );
}

function HeaderRow({ title }: { title: string }) {
  return (
    <View style={styles.rowHeader}>
      <DaimoText style={[ss.text.body, { color: color.gray3 }]}>
        {title}
      </DaimoText>
    </View>
  );
}

function TransferClogRow({
  transferClog,
  account,
  linkTo,
  showDate,
}: {
  transferClog: TransferClog;
  account: Account;
  linkTo: "op" | "account";
  showDate?: boolean;
}) {
  const address = account.address;
  const locale = getI18NLocale();

  assert(transferClog.amount > 0);
  const [from, to] = getDisplayFromTo(transferClog);
  assert([from, to].includes(getAddress(address)));
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  const otherAddr = from === address ? to : from;
  const otherAcc = getCachedEAccount(otherAddr);
  const amountDelta =
    from === address ? -transferClog.amount : transferClog.amount;

  const nav = useNav();
  const viewOp = () => {
    const height = transferClog.type === "createLink" ? 490 : 440;
    setBottomSheetDetailHeight(height);
    (nav as any).navigate("BottomSheetHistoryOp", {
      op: transferClog,
      shouldAddInset: false,
    });
  };
  const viewAccount = () => {
    if (canSendTo(otherAcc)) navToAccountPage(otherAcc, nav);
    else viewOp();
  };

  const isPending = transferClog.status === OpStatus.pending;
  const textCol = isPending ? color.gray3 : color.midnight;

  // Title = counterparty name
  let opTitle = getAccountName(otherAcc, locale);
  if (
    opTitle === AddrLabel.PaymentLink &&
    transferClog.type === "claimLink" &&
    transferClog.noteStatus.sender.addr === address &&
    transferClog.noteStatus.claimer?.addr === address
  ) {
    // Special case: we cancelled our own payment link
    opTitle = i18.op.cancelledLink();
  }

  const opMemo = getSynthesizedMemo(
    transferClog,
    env(daimoChainFromId(account.homeChainId)).chainConfig,
    getI18NLocale(),
    true
  );
  const memoCol = isPending ? color.gray3 : color.grayDark;

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={viewOp}
        {...touchHighlightUnderlay.subtle}
        style={styles.transferClogRowWrap}
      >
        <View style={styles.transferClogRow}>
          <View style={styles.transferOtherAccount}>
            <TouchableOpacity
              onPress={viewAccount}
              disabled={
                linkTo === "op" || otherAcc.label === AddrLabel.PaymentLink
              }
            >
              <ContactBubble
                contact={{ type: "eAcc", ...otherAcc }}
                size={36}
                {...{ isPending }}
              />
            </TouchableOpacity>
            <View style={{ flexDirection: "column" }}>
              <TextBody color={textCol}>{opTitle}</TextBody>
              {opMemo && (
                <>
                  <Spacer h={2} />
                  <TextMeta color={memoCol}>{opMemo}</TextMeta>
                </>
              )}
            </View>
            {isPending && <PendingDot />}
          </View>
          <TransferAmountDate
            amount={amountDelta}
            timestamp={transferClog.timestamp}
            showDate={showDate}
            {...{ isPending }}
          />
        </View>
      </TouchableHighlight>
    </View>
  );
}

function TransferAmountDate({
  amount,
  timestamp,
  showDate,
  isPending,
}: {
  amount: number;
  timestamp: number;
  showDate?: boolean;
  isPending?: boolean;
}) {
  const dollarStr = getAmountText({ amount: BigInt(Math.abs(amount)) });
  const sign = amount < 0 ? "-" : "+";
  const amountColor = amount < 0 ? color.midnight : color.success;

  let timeStr: string;
  if (isPending) {
    timeStr = i18.op.pending();
  } else if (showDate) {
    timeStr = new Date(timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = now();
    timeStr = timeAgo(timestamp, getI18NLocale(), nowS);
  }

  const textCol = isPending ? color.gray3 : color.midnight;
  const amountCol = isPending ? color.gray3 : amountColor;

  return (
    <View style={styles.transferAmountDate}>
      <DaimoText style={[ss.text.metadata, { color: amountCol }]}>
        {sign} {dollarStr}
      </DaimoText>
      <DaimoText style={[ss.text.metadataLight, { color: textCol }]}>
        {timeStr}
      </DaimoText>
    </View>
  );
}

function getTransferClogId(t: TransferClog): string {
  return `${t.timestamp}-${t.from}-${t.to}-${t.txHash}-${t.opHash}`;
}

const styles = StyleSheet.create({
  historyListBody: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 2,
    backgroundColor: color.white,
  },
  transferBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
    backgroundColor: "white",
  },
  transferClogRowWrap: {
    marginHorizontal: -24,
  },
  transferClogRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transferOtherAccount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  transferAmountDate: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 2,
  },
});
