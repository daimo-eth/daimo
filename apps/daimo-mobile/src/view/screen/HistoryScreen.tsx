import {
  TransferOpEvent,
  assert,
  getAccountName,
  timeAgo,
} from "@daimo/common";
import { ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from "react-native";
import { Address, getAddress } from "viem";

import { Account, useAccount } from "../../model/account";
import { AccountBubble } from "../shared/AccountBubble";
import { getAmountText } from "../shared/Amount";
import ScrollPellet from "../shared/ScrollPellet";
import Spacer from "../shared/Spacer";
import { getCachedEAccount } from "../shared/addr";
import { useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBody, TextCenter, TextLight } from "../shared/text";

export function HistoryScreen() {
  const [account] = useAccount();
  if (account == null) return null;

  console.log("[HISTORY] rendering HistoryScreen");

  return (
    <SafeAreaView>
      <View style={ss.container.fullWidthModal}>
        <ScrollPellet />
        <HistoryList account={account} />
      </View>
    </SafeAreaView>
  );
}

export function HistoryList({
  account,
  maxToShow,
}: {
  account: Account;
  maxToShow?: number;
}) {
  const ops = account.recentTransfers.slice().reverse();

  if (ops.length === 0) {
    return (
      <View>
        <Spacer h={8} />
        <TextCenter>
          <TextLight>No transactions yet</TextLight>
        </TextCenter>
      </View>
    );
  }

  const showDate = maxToShow == null;

  const renderRow = (t: TransferOpEvent) => (
    <TransferRow
      key={`${t.timestamp}-${t.from}-${t.to}`}
      transfer={t}
      address={account.address}
      showDate={showDate}
    />
  );

  if (maxToShow != null) {
    return (
      <View style={styles.transferList}>
        <HeaderRow key="h0" title="Transaction history" />
        {ops.slice(0, maxToShow).map(renderRow)}
      </View>
    );
  }

  const stickyIndices = [] as number[];
  const rows: ReactNode[] = [];

  // Render a HeaderRow for each month, and make it sticky
  let lastMonth = "";
  for (const t of ops) {
    const month = new Date(t.timestamp * 1000).toLocaleString("default", {
      year: "numeric",
      month: "long",
    });
    if (month !== lastMonth) {
      stickyIndices.push(rows.length);
      rows.push(<HeaderRow key={month} title={month} />);
      lastMonth = month;
    }
    rows.push(renderRow(t));
  }
  rows.push(<View key="footer" style={styles.transferList} />);

  return <ScrollView stickyHeaderIndices={stickyIndices}>{rows}</ScrollView>;
}

function HeaderRow({ title }: { title: string }) {
  return (
    <View style={styles.rowHeader}>
      <Text style={[ss.text.body, { color: color.gray3 }]}>{title}</Text>
    </View>
  );
}

function TransferRow({
  transfer,
  address,
  showDate,
}: {
  transfer: TransferOpEvent;
  address: Address;
  showDate?: boolean;
}) {
  assert(transfer.amount > 0);
  const from = getAddress(transfer.from);
  const to = getAddress(transfer.to);
  assert([from, to].includes(address));

  const otherAddr = from === address ? to : from;
  const otherAcc = getCachedEAccount(otherAddr);
  const amountDelta = from === address ? -transfer.amount : transfer.amount;

  const nav = useNav();
  const viewOp = () =>
    nav.navigate("HomeTab", { screen: "HistoryOp", params: { op: transfer } });

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={viewOp}
        {...touchHighlightUnderlay.subtle}
        style={styles.transferRowWrap}
      >
        <View style={styles.transferRow}>
          <View style={styles.transferOtherAccount}>
            <AccountBubble eAcc={otherAcc} size={36} />
            <TextBody>{getAccountName(otherAcc)}</TextBody>
          </View>
          <TransferAmountDate
            amount={amountDelta}
            timestamp={transfer.timestamp}
            showDate={showDate}
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
}: {
  amount: number;
  timestamp: number;
  showDate?: boolean;
}) {
  const dollarStr = getAmountText({ amount: BigInt(Math.abs(amount)) });
  const sign = amount < 0 ? "-" : "+";
  const col = amount < 0 ? color.midnight : color.success;

  let timeStr: string;
  if (showDate) {
    timeStr = new Date(timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = Date.now() / 1e3;
    timeStr = timeAgo(timestamp, nowS);
  }

  return (
    <View style={styles.transferAmountDate}>
      <Text style={[ss.text.metadata, { color: col }]}>
        {sign} {dollarStr}
      </Text>
      <Text style={ss.text.metadataLight}>{timeStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 2,
    backgroundColor: color.white,
  },
  transferList: {
    borderBottomWidth: 1,
    borderColor: color.grayLight,
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  transferBorder: {
    borderTopWidth: 1,
    borderColor: color.grayLight,
  },
  transferRowWrap: {
    marginHorizontal: -24,
  },
  transferRow: {
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
