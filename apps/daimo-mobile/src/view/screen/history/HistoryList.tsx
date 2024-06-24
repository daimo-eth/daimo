import {
  AddrLabel,
  DisplayOpEvent,
  EAccount,
  OpStatus,
  assert,
  canSendTo,
  getAccountName,
  getDisplayFromTo,
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

import { SetBottomSheetDetailHeight } from "./HistoryOpScreen";
import { getSynthesizedMemo } from "./shared";
import { navToAccountPage, useNav } from "../../../common/nav";
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
interface DisplayOpRenderObject {
  isHeader: false;
  id: string;
  op: DisplayOpEvent;
}

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
          <TextLight>No transactions yet</TextLight>
        </TextCenter>
      </View>
    );
  }

  const renderRow = (t: DisplayOpEvent) => (
    <DisplayOpRow
      key={getDisplayOpId(t)}
      displayOp={t}
      account={account}
      {...{ linkTo, showDate }}
    />
  );

  // Easy case: show a fixed, small preview list
  if (maxToShow != null) {
    const title = otherAcc == null ? "Recent activity" : `Between you`;
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
  const rows: (DisplayOpRenderObject | HeaderObject)[] = [];

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
      id: getDisplayOpId(op),
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
        return (
          <DisplayOpRow
            displayOp={item.op}
            account={account}
            showDate
            {...{ linkTo }}
          />
        );
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

function DisplayOpRow({
  displayOp,
  account,
  linkTo,
  showDate,
}: {
  displayOp: DisplayOpEvent;
  account: Account;
  linkTo: "op" | "account";
  showDate?: boolean;
}) {
  const address = account.address;

  assert(displayOp.amount > 0);
  const [from, to] = getDisplayFromTo(displayOp);
  assert([from, to].includes(address));
  const setBottomSheetDetailHeight = useContext(SetBottomSheetDetailHeight);

  const otherAddr = from === address ? to : from;
  const otherAcc = getCachedEAccount(otherAddr);
  const amountDelta = from === address ? -displayOp.amount : displayOp.amount;

  const nav = useNav();
  const viewOp = () => {
    const height = displayOp.type === "createLink" ? 490 : 440;
    setBottomSheetDetailHeight(height);
    (nav as any).navigate("BottomSheetHistoryOp", {
      op: displayOp,
      shouldAddInset: false,
    });
  };
  const viewAccount = () => {
    if (canSendTo(otherAcc)) navToAccountPage(otherAcc, nav);
    else viewOp();
  };

  const isPending = displayOp.status === OpStatus.pending;
  const textCol = isPending ? color.gray3 : color.midnight;

  // Title = counterparty name
  let opTitle = getAccountName(otherAcc);
  if (
    opTitle === AddrLabel.PaymentLink &&
    displayOp.type === "claimLink" &&
    displayOp.noteStatus.sender.addr === address &&
    displayOp.noteStatus.claimer?.addr === address
  ) {
    // Special case: we cancelled our own payment link
    opTitle = "cancelled link";
  }

  const opMemo = getSynthesizedMemo(
    displayOp,
    daimoChainFromId(account.homeChainId),
    true
  );
  const memoCol = isPending ? color.gray3 : color.grayDark;

  return (
    <View style={styles.transferBorder}>
      <TouchableHighlight
        onPress={viewOp}
        {...touchHighlightUnderlay.subtle}
        style={styles.displayOpRowWrap}
      >
        <View style={styles.displayOpRow}>
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
            timestamp={displayOp.timestamp}
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
    timeStr = "Pending";
  } else if (showDate) {
    timeStr = new Date(timestamp * 1000).toLocaleString("default", {
      month: "numeric",
      day: "numeric",
    });
  } else {
    const nowS = now();
    timeStr = timeAgo(timestamp, nowS);
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

function getDisplayOpId(t: DisplayOpEvent): string {
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
  displayOpRowWrap: {
    marginHorizontal: -24,
  },
  displayOpRow: {
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
