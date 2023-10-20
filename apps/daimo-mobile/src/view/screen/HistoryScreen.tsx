import {
  AddrLabel,
  EAccount,
  TransferOpEvent,
  assert,
  getAccountName,
  timeAgo,
} from "@daimo/common";
import Octicons from "@expo/vector-icons/Octicons";
import { ReactNode, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
} from "react-native";
import { Address, getAddress } from "viem";

import { Account, useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import ScrollPellet from "../shared/ScrollPellet";
import { getCachedEAccount } from "../shared/addr";
import { useNav } from "../shared/nav";
import { color, ss, touchHighlightUnderlay } from "../shared/style";
import { TextBold, TextCenter, TextLight } from "../shared/text";

export function HistoryScreen() {
  const [account] = useAccount();
  if (account == null) return null;

  return (
    <View style={ss.container.fullWidthModal}>
      <ScrollPellet />
      <HistoryList account={account} />
    </View>
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
    <TouchableHighlight onPress={viewOp} {...touchHighlightUnderlay.subtle}>
      <View style={styles.transferRow}>
        <View style={styles.transferOtherAccount}>
          <AccountBubble eAcc={otherAcc} size={36} />
          <TextBold>{getAccountName(otherAcc)}</TextBold>
        </View>
        <TransferAmountDate
          amount={amountDelta}
          timestamp={transfer.timestamp}
          showDate={showDate}
        />
      </View>
    </TouchableHighlight>
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

function AccountBubble({ eAcc, size }: { eAcc: EAccount; size: number }) {
  const style: ViewStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color.white,
      borderWidth: 1,
      borderColor: color.primary,
      alignItems: "center",
      justifyContent: "center",
    }),
    [size]
  );

  const textStyle: TextStyle = useMemo(
    () => ({
      fontSize: size / 2,
      fontWeight: "bold",
      textAlign: "center",
      color: color.primary,
    }),
    [size]
  );

  const name = getAccountName(eAcc);
  const letter = (function () {
    if (name.startsWith("0x")) {
      return "0x";
    } else if (eAcc.label != null) {
      switch (eAcc.label) {
        case AddrLabel.Faucet:
          return <Octicons name="download" size={16} color={color.primary} />;
        case AddrLabel.PaymentLink:
          return <Octicons name="link" size={16} color={color.primary} />;
        default:
          return "?";
      }
    } else {
      return name[0].toUpperCase();
    }
  })();

  return (
    <View style={style}>
      <Text style={textStyle} numberOfLines={1}>
        {letter}
      </Text>
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
    borderColor: color.ivoryDark,
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  transferRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: color.ivoryDark,
    paddingVertical: 16,
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
