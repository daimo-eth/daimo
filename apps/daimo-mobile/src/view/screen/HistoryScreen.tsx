import { TransferOpEvent, assert, timeAgo } from "@daimo/common";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Address, getAddress } from "viem";

import { Account, useAccount } from "../../model/account";
import { getAmountText } from "../shared/Amount";
import { ButtonSmall } from "../shared/Button";
import ScrollPellet from "../shared/ScrollPellet";
import { AddrText } from "../shared/addr";
import { useNav } from "../shared/nav";
import { OpStatusIndicator } from "../shared/opStatus";
import { color, ss } from "../shared/style";
import {
  TextBold,
  TextCenter,
  TextH3,
  TextLight,
  TextRight,
} from "../shared/text";

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
      <View>
        <HeaderRow key="h0" title="Recent transactions" />
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

  return <ScrollView stickyHeaderIndices={stickyIndices}>{rows}</ScrollView>;
}

function HeaderRow({ title }: { title: string }) {
  return (
    <View style={styles.rowHeader}>
      <TextH3>{title}</TextH3>
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

  const verb = from === address ? "Sent" : "Received";
  const dollarStr = getAmountText({ amount: BigInt(transfer.amount) });
  const toFrom = from === address ? "to" : "from";
  const otherAddr = from === address ? to : from;

  let timeStr: string;
  if (showDate) {
    timeStr = new Date(transfer.timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = Date.now() / 1e3;
    timeStr = timeAgo(transfer.timestamp, nowS);
  }

  const nav = useNav();
  const viewOp = () =>
    nav.navigate("HomeTab", { screen: "HistoryOp", params: { op: transfer } });

  return (
    <ButtonSmall onPress={viewOp}>
      <View style={styles.rowTransfer}>
        <View style={styles.colDesc}>
          <TextLight numberOfLines={1}>
            {verb} <TextBold>{dollarStr}</TextBold> {toFrom}{" "}
            <AddrText addr={otherAddr} />
          </TextLight>
        </View>
        <View style={styles.colTime}>
          <TextLight numberOfLines={1}>
            <TextRight>{timeStr}</TextRight>
          </TextLight>
        </View>
        <View style={styles.colStatus}>
          <OpStatusIndicator status={transfer.status} />
        </View>
      </View>
    </ButtonSmall>
  );
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: color.white,
  },
  rowTransfer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colDesc: {
    flex: 1,
  },
  colTime: {
    flex: 0,
    width: 40,
  },
  colStatus: {
    flex: 0,
    width: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
